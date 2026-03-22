"""
Generate Drizzle defineRelations() TypeScript code from the analyzed
relation graph.  Output matches the existing AFENDA _relations.ts pattern.
"""

from __future__ import annotations

from pathlib import PurePosixPath
from textwrap import indent

from analyze import (
    DomainRelationGraph,
    ManyRelation,
    OneRelation,
    TableRelations,
)
from config import DomainConfig, TableLocation


def generate_relations_ts(graph: DomainRelationGraph) -> str:
    """Produce the full _relations.ts file content for one domain."""
    lines: list[str] = []

    # Collect all tables that need to be imported (domain + external)
    import_groups = _build_imports(graph)
    lines.append('import { defineRelations } from "drizzle-orm";')

    for imp_path, var_names in import_groups:
        names = ", ".join(sorted(var_names))
        lines.append(f'import {{ {names} }} from "{imp_path}";')

    lines.append("")

    # Build the defineRelations call
    all_vars = _all_table_vars(graph)
    lines.append(f"export const {graph.domain.relations_var} = defineRelations(")
    lines.append("  {")
    for var in all_vars:
        lines.append(f"    {var},")
    lines.append("  },")
    lines.append("  (r) => ({")

    # Only emit relation blocks for domain-owned tables
    for var_name in sorted(graph.tables.keys()):
        trel = graph.tables[var_name]
        block = _render_table_block(var_name, trel, graph)
        if block:
            lines.append(indent(block, "    "))

    lines.append("  })")
    lines.append(");")
    lines.append("")

    return "\n".join(lines)


def _build_imports(
    graph: DomainRelationGraph,
) -> list[tuple[str, list[str]]]:
    """
    Group table imports by their source path.
    Returns a list of (import_path, [var_names]) sorted for readability.
    """
    # Gather all tables we need
    all_tables: dict[str, TableLocation] = {}
    for var, trel in graph.tables.items():
        all_tables[var] = trel.location
    for var, loc in graph.external_tables.items():
        all_tables[var] = loc

    # Group by directory relative to the _relations.ts file location
    relations_dir = graph.domain.ts_dir
    groups: dict[str, list[str]] = {}

    for var, loc in all_tables.items():
        imp_path = _relative_import(relations_dir, loc.rel_dir, loc.ts_module)
        groups.setdefault(imp_path, []).append(var)

    # Sort: local imports first (./), then relative (../)
    def sort_key(item: tuple[str, list[str]]) -> tuple[int, str]:
        path = item[0]
        if path.startswith("./"):
            return (0, path)
        return (1, path)

    return sorted(groups.items(), key=sort_key)


def _relative_import(from_dir: str, to_dir: str, module: str) -> str:
    """Compute a TypeScript relative import path."""
    from_parts = PurePosixPath(from_dir).parts
    to_parts = PurePosixPath(to_dir).parts

    # Find common prefix
    common = 0
    for a, b in zip(from_parts, to_parts):
        if a == b:
            common += 1
        else:
            break

    ups = len(from_parts) - common
    downs = list(to_parts[common:])

    if ups == 0 and not downs:
        return f"./{module}"

    prefix = "/".join([".."] * ups) if ups > 0 else "."
    if downs:
        return f"{prefix}/{'/'.join(downs)}/{module}"
    return f"{prefix}/{module}"


def _all_table_vars(graph: DomainRelationGraph) -> list[str]:
    """Get all table variable names sorted: domain tables first, then external."""
    domain_vars = sorted(graph.tables.keys())
    external_vars = sorted(
        v for v in graph.external_tables if v not in graph.tables
    )
    return domain_vars + external_vars


def _render_table_block(
    var_name: str, trel: TableRelations, graph: DomainRelationGraph
) -> str | None:
    """Render the relation block for a single table."""
    entries: list[str] = []

    # r.one relations (sorted: tenant first, then alphabetical)
    ones = sorted(trel.ones, key=lambda o: (o.name != "tenant", o.name))
    for one in ones:
        entries.append(_render_one(var_name, one))

    # r.many relations (sorted alphabetical)
    manys = sorted(trel.manys, key=lambda m: m.name)
    for many in manys:
        entries.append(_render_many(var_name, many))

    if not entries:
        return f"{var_name}: {{}},\n"

    body = "\n".join(entries)
    return f"{var_name}: {{\n{body}\n}},\n"


def _render_one(source_var: str, one: OneRelation) -> str:
    """Render a single r.one.* relation."""
    parts = [
        f"  {one.name}: r.one.{one.target_var}({{",
        f"    from: r.{source_var}.{one.from_field},",
        f"    to: r.{one.target_var}.{one.to_field},",
    ]
    if one.optional:
        parts.append("    optional: true,")
    if one.alias:
        parts.append(f'    alias: "{one.alias}",')
    parts.append("  }),")
    return "\n".join(parts)


def _render_many(source_var: str, many: ManyRelation) -> str:
    """Render a single r.many.* relation."""
    parts = [
        f"  {many.name}: r.many.{many.target_var}({{",
        f"    from: r.{source_var}.{many.from_field},",
        f"    to: r.{many.target_var}.{many.to_field},",
    ]
    if many.alias:
        parts.append(f'    alias: "{many.alias}",')
    parts.append("  }),")
    return "\n".join(parts)
