from pathlib import Path

from react_governance.normalize import (
    extract_imports_from_line,
    normalize_afenda_package,
    package_segment_for_path,
    resolve_relative_target,
)


def test_normalize_afenda_strips_subpath() -> None:
    assert normalize_afenda_package("@afenda/ui-core/button") == "@afenda/ui-core"
    assert normalize_afenda_package("@afenda/view-engine") == "@afenda/view-engine"
    assert normalize_afenda_package("react") is None


def test_extract_imports() -> None:
    assert extract_imports_from_line("import x from 'lodash'") == ["lodash"]
    assert extract_imports_from_line("import './globals.css'") == ["./globals.css"]
    assert extract_imports_from_line("export { a } from '@/lib/x'") == ["@/lib/x"]
    assert extract_imports_from_line("void import('./chunk')") == ["./chunk"]


def test_package_segment(tmp_path: Path) -> None:
    repo = tmp_path
    (repo / "packages" / "ui-core" / "src").mkdir(parents=True)
    f = repo / "packages" / "ui-core" / "src" / "a.tsx"
    f.write_text("", encoding="utf-8")
    assert package_segment_for_path(repo, f) == "ui-core"


def test_resolve_relative_same_package(tmp_path: Path) -> None:
    repo = tmp_path
    base = repo / "packages" / "ui-core" / "src" / "foo"
    base.mkdir(parents=True)
    target = repo / "packages" / "ui-core" / "src" / "bar.ts"
    target.write_text("export const x = 1", encoding="utf-8")
    src = base / "x.tsx"
    src.write_text("", encoding="utf-8")
    resolved = resolve_relative_target(src, "../bar")
    assert resolved == target.resolve()
