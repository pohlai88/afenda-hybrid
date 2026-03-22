#!/usr/bin/env python3
"""
CLI entry point for the AFENDA relations generator.

Usage:
    python cli.py audit              # Show coverage gaps per domain
    python cli.py generate           # Generate _relations.ts for all domains
    python cli.py generate --domain hr  # Generate for one domain
    python cli.py diff               # Compare generated vs existing
    python cli.py diff --domain hr   # Compare for one domain
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax

from config import DOMAIN_BY_SCHEMA, DOMAINS, DomainConfig, INTENTIONAL_NON_FK_COLUMNS
from introspect import introspect, SchemaMetadata
from analyze import analyze, DomainRelationGraph
from generate import generate_relations_ts

app = typer.Typer(
    name="afenda-relations",
    help="Introspect PostgreSQL FKs and generate Drizzle defineRelations() code.",
)
console = Console()

# Resolve project root (tools/db/relations → project root)
TOOL_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOL_DIR.parent.parent.parent
SRC_DB = PROJECT_ROOT / "src" / "db"


def _get_meta(conn: Optional[str]) -> SchemaMetadata:
    console.print("[dim]Connecting to PostgreSQL and introspecting schemas...[/dim]")
    return introspect(conn)


def _get_graphs(
    meta: SchemaMetadata, domain: Optional[str] = None
) -> dict[str, DomainRelationGraph]:
    graphs = analyze(meta, SRC_DB)
    if domain:
        if domain not in graphs:
            console.print(f"[red]Unknown domain: {domain}[/red]")
            console.print(f"Available: {', '.join(graphs.keys())}")
            raise typer.Exit(1)
        return {domain: graphs[domain]}
    return graphs


@app.command()
def audit(
    conn: Optional[str] = typer.Option(None, "--conn", help="PostgreSQL connection string"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="Filter to one domain"),
):
    """Show relation coverage audit: tables, FKs found, and gaps."""
    meta = _get_meta(conn)
    graphs = _get_graphs(meta, domain)

    summary_table = Table(title="Relation Coverage Audit", show_lines=True)
    summary_table.add_column("Domain", style="bold")
    summary_table.add_column("Tables", justify="right")
    summary_table.add_column("FKs Found", justify="right")
    summary_table.add_column("One Relations", justify="right")
    summary_table.add_column("Many Relations", justify="right")
    summary_table.add_column("Tables w/ Relations", justify="right")
    summary_table.add_column("Coverage", justify="right")

    total_tables = 0
    total_with_rels = 0

    for schema_name in sorted(graphs.keys()):
        graph = graphs[schema_name]
        n_tables = len(graph.tables)
        n_fks = sum(len(tr.ones) for tr in graph.tables.values())
        n_manys = sum(len(tr.manys) for tr in graph.tables.values())
        n_with = sum(
            1 for tr in graph.tables.values()
            if tr.ones or tr.manys
        )
        pct = f"{n_with / n_tables * 100:.0f}%" if n_tables else "N/A"

        total_tables += n_tables
        total_with_rels += n_with

        # Color by coverage
        if n_with == n_tables:
            style = "green"
        elif n_with / n_tables >= 0.7:
            style = "yellow"
        else:
            style = "red"

        summary_table.add_row(
            schema_name,
            str(n_tables),
            str(n_fks),
            str(n_fks),  # one relation per FK
            str(n_manys),
            f"[{style}]{n_with}/{n_tables}[/{style}]",
            f"[{style}]{pct}[/{style}]",
        )

    total_pct = f"{total_with_rels / total_tables * 100:.0f}%" if total_tables else "N/A"
    summary_table.add_row(
        "[bold]TOTAL[/bold]",
        str(total_tables),
        "",
        "",
        "",
        f"[bold]{total_with_rels}/{total_tables}[/bold]",
        f"[bold]{total_pct}[/bold]",
    )

    console.print(summary_table)

    # Detail: tables without any FK (orphans)
    for schema_name in sorted(graphs.keys()):
        graph = graphs[schema_name]
        orphans = [
            var for var, tr in graph.tables.items()
            if not tr.ones and not tr.manys
        ]
        if orphans:
            console.print(
                f"\n[yellow]{schema_name}[/yellow] — tables with no relations: "
                + ", ".join(orphans)
            )


@app.command()
def generate(
    conn: Optional[str] = typer.Option(None, "--conn", help="PostgreSQL connection string"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="Filter to one domain"),
    output_dir: Optional[str] = typer.Option(None, "--output", "-o", help="Output directory (default: stdout)"),
    write: bool = typer.Option(False, "--write", "-w", help="Write files in-place under packages/db/src/"),
):
    """Generate _relations.ts files from live PostgreSQL FK metadata."""
    meta = _get_meta(conn)
    graphs = _get_graphs(meta, domain)

    for schema_name in sorted(graphs.keys()):
        graph = graphs[schema_name]
        ts_code = generate_relations_ts(graph)

        if write:
            target = SRC_DB / graph.domain.ts_dir / "_relations.generated.ts"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(ts_code, encoding="utf-8")
            console.print(
                f"[green]Wrote[/green] {target.relative_to(PROJECT_ROOT)}"
            )
        elif output_dir:
            out = Path(output_dir)
            out.mkdir(parents=True, exist_ok=True)
            target = out / f"{schema_name}_relations.ts"
            target.write_text(ts_code, encoding="utf-8")
            console.print(f"[green]Wrote[/green] {target}")
        else:
            console.print(Panel(
                Syntax(ts_code, "typescript", theme="monokai", line_numbers=True),
                title=f"[bold]{schema_name}[/bold] _relations.ts",
                expand=True,
            ))


@app.command()
def diff(
    conn: Optional[str] = typer.Option(None, "--conn", help="PostgreSQL connection string"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="Filter to one domain"),
):
    """Compare existing _relations.ts files against what the DB defines."""
    meta = _get_meta(conn)
    graphs = _get_graphs(meta, domain)

    for schema_name in sorted(graphs.keys()):
        graph = graphs[schema_name]
        existing_path = SRC_DB / graph.domain.ts_dir / "_relations.ts"

        generated = generate_relations_ts(graph)

        if not existing_path.exists():
            console.print(f"[red]{schema_name}[/red]: _relations.ts does not exist!")
            continue

        existing = existing_path.read_text(encoding="utf-8")

        # Parse table blocks from existing to find what's covered
        existing_tables = _extract_table_vars_from_define_relations(existing)
        generated_tables = set(graph.tables.keys())

        missing = generated_tables - existing_tables
        extra = existing_tables - generated_tables

        if not missing and not extra:
            console.print(
                f"[green]{schema_name}[/green]: All {len(generated_tables)} "
                f"tables covered in existing _relations.ts"
            )
        else:
            if missing:
                console.print(
                    f"[yellow]{schema_name}[/yellow]: "
                    f"[red]{len(missing)} tables MISSING[/red] from _relations.ts:"
                )
                for m in sorted(missing):
                    console.print(f"  [red]- {m}[/red]")
            if extra:
                console.print(
                    f"[yellow]{schema_name}[/yellow]: "
                    f"{len(extra)} tables in _relations.ts but not in DB schema:"
                )
                for e in sorted(extra):
                    console.print(f"  [dim]- {e}[/dim]")


def _extract_table_vars_from_define_relations(ts_content: str) -> set[str]:
    """
    Parse a _relations.ts file to find table variable names that appear
    in the defineRelations first argument object.  Simple regex-based.
    """
    import re

    # Find the object literal in defineRelations({ ... }, ...)
    # Look for lines like "    tableName," in the first arg block
    in_first_arg = False
    tables: set[str] = set()
    brace_depth = 0

    for line in ts_content.splitlines():
        stripped = line.strip()

        if "defineRelations(" in stripped:
            in_first_arg = True
            continue

        if in_first_arg:
            if stripped == "{":
                brace_depth += 1
                continue
            if stripped.startswith("}"):
                brace_depth -= 1
                if brace_depth <= 0:
                    in_first_arg = False
                continue

            # Lines like "    tableName," or "    tableName"
            match = re.match(r"^(\w+),?$", stripped)
            if match:
                tables.add(match.group(1))

    return tables


@app.command(name="fk-gaps")
def fk_gaps(
    conn: Optional[str] = typer.Option(None, "--conn", help="PostgreSQL connection string"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="Filter to one domain"),
):
    """
    Detect columns that look like foreign keys (end in 'Id', match another
    table's PK) but lack actual FK constraints in the database.

    These represent gaps between Drizzle schema definitions and DB reality.
    """
    meta = _get_meta(conn)

    # Build a set of known PKs: (schema.table) -> pk_column
    pk_lookup: dict[str, str] = {}
    for (schema, table), pk_col in meta.primary_keys.items():
        pk_lookup[f"{schema}.{table}"] = pk_col

    # Build a set of existing FK columns: (schema, table, column)
    existing_fks: set[tuple[str, str, str]] = set()
    for fk in meta.foreign_keys:
        existing_fks.add((fk.source_schema, fk.source_table, fk.source_column))

    # Build PK column name -> possible (schema, table) mapping
    pk_col_to_table: dict[str, list[tuple[str, str]]] = {}
    for (schema, table), pk_col in meta.primary_keys.items():
        pk_col_to_table.setdefault(pk_col, []).append((schema, table))

    from config import pg_to_camel

    gap_table = Table(title="Potential Missing FK Constraints", show_lines=True)
    gap_table.add_column("Source", style="cyan")
    gap_table.add_column("Column")
    gap_table.add_column("Likely Target", style="yellow")
    gap_table.add_column("Has FK?", justify="center")

    gap_count = 0
    for (schema, table), columns in sorted(meta.tables.items()):
        if domain and schema != domain:
            continue
        for col in columns:
            camel = pg_to_camel(col.column)
            # Skip known non-FK patterns
            if camel in ("tenantId",) and (schema, table, col.column) in existing_fks:
                continue
            if not camel.endswith("Id"):
                continue
            if camel == pg_to_camel(meta.primary_keys.get((schema, table), "")):
                continue  # Skip PKs

            has_fk = (schema, table, col.column) in existing_fks
            if has_fk:
                continue  # Only show gaps

            if (schema, table, col.column) in INTENTIONAL_NON_FK_COLUMNS:
                continue  # Documented intentional non-FK (polymorphic / opaque id)

            # Try to find a matching PK
            # e.g. employeeId -> look for tables with PK "employeeId"
            possible_targets = pk_col_to_table.get(col.column, [])
            target_str = ", ".join(f"{s}.{t}" for s, t in possible_targets) if possible_targets else "[dim]unknown[/dim]"

            gap_table.add_row(
                f"{schema}.{table}",
                camel,
                target_str,
                "[red]NO[/red]",
            )
            gap_count += 1

    console.print(gap_table)
    console.print(f"\n[bold]{gap_count}[/bold] columns missing FK constraints")
    if gap_count > 0:
        console.print(
            "[yellow]These columns match PK naming patterns but have no FK constraint "
            "in the database. Consider adding foreignKey() definitions and generating "
            "a migration.[/yellow]"
        )


@app.command()
def tables(
    conn: Optional[str] = typer.Option(None, "--conn", help="PostgreSQL connection string"),
    domain: Optional[str] = typer.Option(None, "--domain", "-d", help="Filter to one domain"),
):
    """List all tables per domain with their TypeScript variable names and file paths."""
    meta = _get_meta(conn)
    graphs = _get_graphs(meta, domain)

    for schema_name in sorted(graphs.keys()):
        graph = graphs[schema_name]
        t = Table(title=f"{schema_name} tables", show_lines=False)
        t.add_column("TS Variable", style="cyan")
        t.add_column("PG Table")
        t.add_column("File Path", style="dim")
        t.add_column("FKs", justify="right")

        for var in sorted(graph.tables.keys()):
            trel = graph.tables[var]
            loc = trel.location
            n_fks = len(trel.ones)
            t.add_row(var, loc.pg_table, loc.rel_dir, str(n_fks))

        console.print(t)
        console.print()


if __name__ == "__main__":
    app()
