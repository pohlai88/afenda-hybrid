from __future__ import annotations

import sys
from pathlib import Path

from react_governance.context import ImportContext
from react_governance.gitutil import git_changed_paths
from react_governance.normalize import (
    is_relative_import,
    normalize_afenda_package,
    package_segment_for_path,
    resolve_relative_target,
)
from react_governance.models import Violation
from react_governance.registry import RULES
from react_governance.scanner import iter_imports_in_file, iter_scan_files


def discover_repo_root(start: Path | None = None) -> Path:
    start = Path(start).resolve() if start is not None else Path.cwd().resolve()
    for p in [start, *start.parents]:
        if (p / "pnpm-workspace.yaml").is_file() and (p / "package.json").is_file():
            return p
    print(
        "react-governance: could not find monorepo root (pnpm-workspace.yaml + package.json).",
        file=sys.stderr,
    )
    raise SystemExit(2)


def build_import_context(repo_root: Path, file_path: Path, line: int, raw_import: str) -> ImportContext:
    seg = package_segment_for_path(repo_root, file_path)
    norm = normalize_afenda_package(raw_import)
    resolved = None
    if is_relative_import(raw_import):
        resolved = resolve_relative_target(file_path, raw_import)
    return ImportContext(
        repo_root=repo_root,
        file_path=file_path,
        line=line,
        raw_import=raw_import,
        source_segment=seg,
        normalized_afenda=norm,
        resolved_relative=resolved,
    )


def run_check(
    repo_root: Path,
    *,
    changed_only: bool = False,
    base_ref: str | None = None,
) -> tuple[list[Violation], int]:
    """
    Returns (violations, files_scanned).
    If --changed and git fails, falls back to full scan (with stderr warning).
    """
    changed_set: set[str] | None = None
    if changed_only:
        raw_changed = git_changed_paths(repo_root, base_ref)
        if raw_changed is None:
            print(
                "react-governance: warning: could not list changed files via git; scanning all files.",
                file=sys.stderr,
            )
        else:
            changed_set = {
                p.replace("\\", "/")
                for p in raw_changed
                if p.endswith((".ts", ".tsx", ".mts", ".cts"))
            }

    files = iter_scan_files(repo_root, changed_rel_paths=changed_set)
    violations: list[Violation] = []
    for fp in files:
        for line_no, spec in iter_imports_in_file(fp):
            ctx = build_import_context(repo_root, fp, line_no, spec)
            for rule in RULES:
                violations.extend(rule.evaluate(ctx))
    return violations, len(files)


def summarize(violations: list[Violation]) -> dict:
    errors = sum(1 for v in violations if v.severity == "error")
    warnings = sum(1 for v in violations if v.severity == "warn")
    infos = sum(1 for v in violations if v.severity == "info")
    return {
        "violations": len(violations),
        "errors": errors,
        "warnings": warnings,
        "infos": infos,
    }
