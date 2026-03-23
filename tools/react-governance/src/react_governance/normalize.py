from __future__ import annotations

import re
from pathlib import Path


def normalize_afenda_package(import_spec: str) -> str | None:
    """
    Collapse @afenda/foo/bar/baz -> @afenda/foo for layer matching.
    Returns None if not a workspace @afenda/* import.
    """
    s = import_spec.strip()
    if not s.startswith("@afenda/"):
        return None
    rest = s[len("@afenda/") :]
    if not rest:
        return None
    pkg = rest.split("/")[0]
    if not pkg:
        return None
    return f"@afenda/{pkg}"


def is_relative_import(import_spec: str) -> bool:
    s = import_spec.strip()
    return s.startswith("./") or s.startswith("../")


def resolve_relative_target(file_path: Path, import_spec: str) -> Path | None:
    """
    Resolve a relative TS import to an absolute path (best-effort).
    Tries exact path, then .ts / .tsx / index.ts / index.tsx.
    """
    spec = import_spec.strip()
    if not is_relative_import(spec):
        return None
    base = (file_path.parent / spec).resolve()
    if base.is_file():
        return base
    for suffix in (".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"):
        p = base.with_suffix(suffix)
        if p.is_file():
            return p
    # directory import
    if base.is_dir():
        for name in ("index.ts", "index.tsx", "index.mts", "index.js", "index.jsx"):
            p = base / name
            if p.is_file():
                return p
    return None


def package_segment_for_path(repo_root: Path, file_path: Path) -> str | None:
    """Return ui-core | view-engine | erp-view-pack | db | web | other package folder name."""
    try:
        rel = file_path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return None
    parts = rel.parts
    if len(parts) >= 2 and parts[0] == "packages":
        return parts[1]
    if len(parts) >= 3 and parts[0] == "apps" and parts[1] == "web":
        return "web"
    return None


def path_under_apps_web(repo_root: Path, path: Path) -> bool:
    try:
        rel = path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return False
    return len(rel.parts) >= 2 and rel.parts[0] == "apps" and rel.parts[1] == "web"


def path_under_packages(repo_root: Path, path: Path) -> bool:
    try:
        rel = path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return False
    return len(rel.parts) >= 1 and rel.parts[0] == "packages"


# Best-effort: side-effect import, import/from, export/from, dynamic import, require
_IMPORT_PATTERNS = [
    re.compile(r"""import\s+['"]([^'"]+)['"]"""),
    re.compile(r"""import\s+.+?\s+from\s+['"]([^'"]+)['"]"""),
    re.compile(r"""export\s+.+?\s+from\s+['"]([^'"]+)['"]"""),
    re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)"""),
    re.compile(r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)"""),
]


def extract_imports_from_line(line: str) -> list[str]:
    """Return all string specifiers found on one line (deduped, order preserved)."""
    found: list[str] = []
    for pat in _IMPORT_PATTERNS:
        for m in pat.finditer(line):
            found.append(m.group(1))
    return list(dict.fromkeys(found))
