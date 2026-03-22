"""
Introspect PostgreSQL: extract tables, columns, foreign keys, and unique
constraints from information_schema for the AFENDA target schemas.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

import psycopg

from config import DOMAIN_BY_SCHEMA

TARGET_SCHEMAS = tuple(DOMAIN_BY_SCHEMA.keys())


@dataclass(frozen=True)
class ColumnInfo:
    schema: str
    table: str
    column: str
    data_type: str
    is_nullable: bool
    ordinal: int


@dataclass(frozen=True)
class ForeignKey:
    """One FK constraint (single-column only; composites are rare in AFENDA)."""
    constraint_name: str
    source_schema: str
    source_table: str
    source_column: str
    target_schema: str
    target_table: str
    target_column: str
    is_source_nullable: bool  # whether the FK column allows NULL


@dataclass(frozen=True)
class UniqueConstraint:
    """A unique constraint or unique index covering a single column."""
    schema: str
    table: str
    column: str
    constraint_name: str


@dataclass
class SchemaMetadata:
    """Complete introspection result for all target schemas."""
    tables: dict[tuple[str, str], list[ColumnInfo]] = field(default_factory=dict)
    foreign_keys: list[ForeignKey] = field(default_factory=list)
    unique_columns: set[tuple[str, str, str]] = field(default_factory=set)
    primary_keys: dict[tuple[str, str], str] = field(default_factory=dict)


def get_connection_string() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        url = "postgresql://postgres:postgres@localhost:5433/afenda_test"
    return url


def introspect(conn_string: str | None = None) -> SchemaMetadata:
    """Query PostgreSQL metadata and return structured results."""
    dsn = conn_string or get_connection_string()
    meta = SchemaMetadata()

    with psycopg.connect(dsn) as conn:
        _load_tables_and_columns(conn, meta)
        _load_primary_keys(conn, meta)
        _load_foreign_keys(conn, meta)
        _load_unique_constraints(conn, meta)

    return meta


def _load_tables_and_columns(conn: psycopg.Connection, meta: SchemaMetadata) -> None:
    sql = """
        SELECT table_schema, table_name, column_name, data_type,
               is_nullable::text, ordinal_position
        FROM information_schema.columns
        WHERE table_schema = ANY(%s)
        ORDER BY table_schema, table_name, ordinal_position
    """
    with conn.cursor() as cur:
        cur.execute(sql, (list(TARGET_SCHEMAS),))
        for row in cur.fetchall():
            schema, table, col, dtype, nullable, ordinal = row
            ci = ColumnInfo(
                schema=schema,
                table=table,
                column=col,
                data_type=dtype,
                is_nullable=(nullable == "YES"),
                ordinal=ordinal,
            )
            key = (schema, table)
            meta.tables.setdefault(key, []).append(ci)


def _load_primary_keys(conn: psycopg.Connection, meta: SchemaMetadata) -> None:
    sql = """
        SELECT tc.table_schema, tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = ANY(%s)
    """
    with conn.cursor() as cur:
        cur.execute(sql, (list(TARGET_SCHEMAS),))
        for schema, table, col in cur.fetchall():
            meta.primary_keys[(schema, table)] = col


def _load_foreign_keys(conn: psycopg.Connection, meta: SchemaMetadata) -> None:
    sql = """
        SELECT
            tc.constraint_name,
            tc.table_schema   AS source_schema,
            tc.table_name     AS source_table,
            kcu.column_name   AS source_column,
            ccu.table_schema  AS target_schema,
            ccu.table_name    AS target_table,
            ccu.column_name   AS target_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = ANY(%s)
        ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position
    """
    # Build a nullable lookup
    nullable_lookup: dict[tuple[str, str, str], bool] = {}
    for key, cols in meta.tables.items():
        for ci in cols:
            nullable_lookup[(ci.schema, ci.table, ci.column)] = ci.is_nullable

    with conn.cursor() as cur:
        cur.execute(sql, (list(TARGET_SCHEMAS),))
        for row in cur.fetchall():
            cname, s_schema, s_table, s_col, t_schema, t_table, t_col = row
            is_nullable = nullable_lookup.get((s_schema, s_table, s_col), False)
            meta.foreign_keys.append(ForeignKey(
                constraint_name=cname,
                source_schema=s_schema,
                source_table=s_table,
                source_column=s_col,
                target_schema=t_schema,
                target_table=t_table,
                target_column=t_col,
                is_source_nullable=is_nullable,
            ))


def _load_unique_constraints(conn: psycopg.Connection, meta: SchemaMetadata) -> None:
    sql = """
        SELECT tc.table_schema, tc.table_name, kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
            AND tc.table_schema = ANY(%s)
    """
    with conn.cursor() as cur:
        cur.execute(sql, (list(TARGET_SCHEMAS),))
        for schema, table, col, cname in cur.fetchall():
            meta.unique_columns.add((schema, table, col))
