from __future__ import annotations

from pathlib import Path

from react_governance.normalize import extract_imports_from_line


def should_skip_path(path: Path) -> bool:
    parts = path.parts
    if "node_modules" in parts:
        return True
    if "dist" in parts:
        return True
    if ".next" in parts:
        return True
    if "coverage" in parts:
        return True
    if "storybook-static" in parts:
        return True
    if path.suffix not in {".ts", ".tsx", ".mts", ".cts"}:
        return True
    return False


def iter_scan_files(
    repo_root: Path,
    *,
    changed_rel_paths: set[str] | None = None,
) -> list[Path]:
    """Collect .ts/.tsx under packages/* and apps/web."""
    repo_root = repo_root.resolve()
    roots = [repo_root / "packages", repo_root / "apps" / "web"]
    out: list[Path] = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if should_skip_path(path):
                continue
            rel = path.relative_to(repo_root).as_posix()
            if changed_rel_paths is not None and rel not in changed_rel_paths:
                continue
            out.append(path)
    out.sort()
    return out


def iter_imports_in_file(path: Path) -> list[tuple[int, str]]:
    """Yield (1-based line number, import specifier) for each extracted import."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return []
    results: list[tuple[int, str]] = []
    for i, line in enumerate(text.splitlines(), start=1):
        for spec in extract_imports_from_line(line):
            results.append((i, spec))
    return results
