"""
Analyze introspected FK metadata into a structured relation graph suitable
for generating Drizzle defineRelations() TypeScript code.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from config import (
    DOMAIN_BY_SCHEMA,
    DomainConfig,
    TableLocation,
    pg_to_camel,
    pg_table_to_ts_var,
    relation_name_for_fk,
    alias_for_duplicate,
)
from introspect import ForeignKey, SchemaMetadata


@dataclass(frozen=True)
class OneRelation:
    """r.one.targetVar({ from, to, optional?, alias? })"""
    name: str
    target_var: str
    from_field: str   # camelCase FK column on source
    to_field: str     # camelCase PK column on target
    optional: bool
    alias: str | None = None


@dataclass(frozen=True)
class ManyRelation:
    """r.many.targetVar({ from, to })"""
    name: str
    target_var: str
    from_field: str   # camelCase PK column on source (parent side)
    to_field: str     # camelCase FK column on target (child side)
    alias: str | None = None


@dataclass
class TableRelations:
    """All relations for one table."""
    location: TableLocation
    ones: list[OneRelation] = field(default_factory=list)
    manys: list[ManyRelation] = field(default_factory=list)


@dataclass
class DomainRelationGraph:
    """Complete relation graph for one domain (= one _relations.ts file)."""
    domain: DomainConfig
    tables: dict[str, TableRelations] = field(default_factory=dict)
    external_tables: dict[str, TableLocation] = field(default_factory=dict)


def analyze(meta: SchemaMetadata, src_db_root: Path) -> dict[str, DomainRelationGraph]:
    """
    Build relation graphs for all domains from introspected metadata.

    Returns a dict keyed by pg_schema name.
    """
    # Step 1: resolve every table to its filesystem location
    table_locations = _resolve_all_tables(meta, src_db_root)

    # Step 2: group FKs by source domain
    fks_by_domain: dict[str, list[ForeignKey]] = {}
    for fk in meta.foreign_keys:
        fks_by_domain.setdefault(fk.source_schema, []).append(fk)

    # Step 3: build relation graph per domain
    graphs: dict[str, DomainRelationGraph] = {}
    for domain in DOMAIN_BY_SCHEMA.values():
        graph = DomainRelationGraph(domain=domain)
        graphs[domain.pg_schema] = graph

        # Register all domain-owned tables
        for (schema, table), _cols in meta.tables.items():
            if schema != domain.pg_schema:
                continue
            loc = table_locations.get((schema, table))
            if not loc:
                continue
            graph.tables[loc.ts_var] = TableRelations(location=loc)

    # Step 4: populate one-side relations (FK holder → parent)
    # and track reverse many-side relations (parent → children)
    reverse_manys: dict[str, dict[str, list[tuple[ForeignKey, TableLocation]]]] = {}

    for schema, fk_list in fks_by_domain.items():
        graph = graphs.get(schema)
        if not graph:
            continue

        # Detect duplicate FK targets within each table for alias assignment
        fks_by_source_table: dict[str, list[ForeignKey]] = {}
        for fk in fk_list:
            fks_by_source_table.setdefault(fk.source_table, []).append(fk)

        for table_name, table_fks in fks_by_source_table.items():
            src_loc = table_locations.get((schema, table_name))
            if not src_loc:
                continue
            trel = graph.tables.get(src_loc.ts_var)
            if not trel:
                continue

            # Count how many FKs point to the same target table
            target_counts: dict[str, int] = {}
            for fk in table_fks:
                tgt_key = f"{fk.target_schema}.{fk.target_table}"
                target_counts[tgt_key] = target_counts.get(tgt_key, 0) + 1

            for fk in table_fks:
                tgt_loc = table_locations.get((fk.target_schema, fk.target_table))
                if not tgt_loc:
                    continue

                # Register external table if target is outside this domain
                if fk.target_schema != schema:
                    graph.external_tables[tgt_loc.ts_var] = tgt_loc

                is_self_ref = (fk.source_schema == fk.target_schema
                               and fk.source_table == fk.target_table)

                from_field = pg_to_camel(fk.source_column)
                to_field = pg_to_camel(fk.target_column)

                rel_name = relation_name_for_fk(
                    from_field, tgt_loc.ts_var, is_self_ref
                )

                tgt_key = f"{fk.target_schema}.{fk.target_table}"
                needs_alias = target_counts[tgt_key] > 1

                alias = None
                if needs_alias:
                    # First FK to a target gets no alias (primary relation)
                    # Subsequent ones get aliases
                    first_fk_col = None
                    for candidate in table_fks:
                        if (f"{candidate.target_schema}.{candidate.target_table}"
                                == tgt_key):
                            first_fk_col = candidate.source_column
                            break
                    if fk.source_column != first_fk_col:
                        alias = alias_for_duplicate(
                            src_loc.ts_var, from_field, tgt_loc.ts_var
                        )

                one = OneRelation(
                    name=rel_name,
                    target_var=tgt_loc.ts_var,
                    from_field=from_field,
                    to_field=to_field,
                    optional=fk.is_source_nullable,
                    alias=alias,
                )
                trel.ones.append(one)

                # Track reverse many
                reverse_manys.setdefault(
                    f"{fk.target_schema}.{fk.target_table}", {}
                ).setdefault(
                    fk.target_schema, []
                ).append((fk, src_loc))

    # Step 5: populate many-side relations
    for (tgt_schema, tgt_table), pk_col in meta.primary_keys.items():
        domain = DOMAIN_BY_SCHEMA.get(tgt_schema)
        if not domain:
            continue
        graph = graphs[tgt_schema]
        tgt_loc = table_locations.get((tgt_schema, tgt_table))
        if not tgt_loc:
            continue
        trel = graph.tables.get(tgt_loc.ts_var)
        if not trel:
            continue

        reverse_key = f"{tgt_schema}.{tgt_table}"
        all_reverses = reverse_manys.get(reverse_key, {})

        # Collect all FKs pointing AT this table from any schema
        all_fk_pairs: list[tuple[ForeignKey, TableLocation]] = []
        for _schema, pairs in all_reverses.items():
            all_fk_pairs.extend(pairs)

        # Count how many child tables are the same (for alias on many side)
        child_table_counts: dict[str, int] = {}
        for fk, child_loc in all_fk_pairs:
            child_table_counts[child_loc.ts_var] = (
                child_table_counts.get(child_loc.ts_var, 0) + 1
            )

        for fk, child_loc in all_fk_pairs:
            # Only add many-relations for children within the same domain
            # or explicitly cross-schema children already in the table registry
            if child_loc.ts_var not in graph.tables and child_loc.ts_var not in graph.external_tables:
                # Check if child is in same domain
                if fk.source_schema != tgt_schema:
                    continue

            from_field = pg_to_camel(pk_col)
            to_field = pg_to_camel(fk.source_column)

            # Derive many-side name from the child table
            many_name = child_loc.ts_var

            needs_alias = child_table_counts.get(child_loc.ts_var, 0) > 1
            alias = None
            if needs_alias:
                alias = alias_for_duplicate(
                    tgt_loc.ts_var, to_field, child_loc.ts_var
                )
                many_name = relation_name_for_fk(to_field, child_loc.ts_var)
                # Prefix to avoid collision: e.g. "approvedLeaveRequests"
                fk_stem = pg_to_camel(fk.source_column)
                if fk_stem.endswith("Id"):
                    fk_stem = fk_stem[:-2]
                many_name = fk_stem + child_loc.ts_var[0].upper() + child_loc.ts_var[1:]

            # Register the child as external if needed
            if child_loc.ts_var not in graph.tables:
                graph.external_tables[child_loc.ts_var] = child_loc

            many = ManyRelation(
                name=many_name,
                target_var=child_loc.ts_var,
                from_field=from_field,
                to_field=to_field,
                alias=alias,
            )
            trel.manys.append(many)

    return graphs


def _resolve_all_tables(
    meta: SchemaMetadata, src_db_root: Path
) -> dict[tuple[str, str], TableLocation]:
    """Map every (schema, table) to its TypeScript file location on disk."""
    locations: dict[tuple[str, str], TableLocation] = {}

    for (schema, table) in meta.tables:
        domain = DOMAIN_BY_SCHEMA.get(schema)
        if not domain:
            continue

        ts_var = pg_table_to_ts_var(table)
        ts_module = ts_var  # module name == variable name in AFENDA

        # Scan subdirectories to find the actual file
        domain_dir = src_db_root / domain.ts_dir
        subdir, actual_module = _find_table_file(domain_dir, ts_module)
        ts_module = actual_module

        if subdir is None:
            rel_dir = domain.ts_dir
        else:
            rel_dir = f"{domain.ts_dir}/{subdir}"

        locations[(schema, table)] = TableLocation(
            pg_schema=schema,
            pg_table=table,
            ts_var=ts_var,
            ts_module=ts_module,
            rel_dir=rel_dir,
            domain=domain,
        )

    return locations


def _find_table_file(domain_dir: Path, module_name: str) -> tuple[str | None, str]:
    """
    Search domain_dir recursively for the file exporting `module_name`.

    First checks for an exact filename match ({module_name}.ts), then falls
    back to scanning .ts file contents for `export const {module_name}`.

    Returns (subdirectory_path_or_None, actual_module_name).
    The actual_module_name may differ from module_name when the table is
    co-located in another file (e.g. retentionExecutions in retentionPolicy.ts).
    """
    if not domain_dir.exists():
        return None, module_name

    # Exact filename match first
    target = f"{module_name}.ts"
    for path in domain_dir.rglob(target):
        rel = path.parent.relative_to(domain_dir)
        subdir = None if str(rel) == "." else str(rel).replace("\\", "/")
        return subdir, module_name

    # Fallback: scan file contents for `export const {module_name}`
    search_pattern = f"export const {module_name}"
    for path in domain_dir.rglob("*.ts"):
        if path.name.startswith("_"):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        if search_pattern in content:
            actual_module = path.stem
            rel = path.parent.relative_to(domain_dir)
            subdir = None if str(rel) == "." else str(rel).replace("\\", "/")
            return subdir, actual_module

    return None, module_name
