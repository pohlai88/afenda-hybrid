from pathlib import Path

from react_governance.context import ImportContext
from react_governance.engine import build_import_context
from react_governance.registry import RULES, rule_by_id
from react_governance.rules.layers import Layer001UiCoreNoViewEngine


def test_rule_by_id_case_insensitive() -> None:
    r = rule_by_id("layer_001")
    assert r is not None
    assert r.id == "LAYER_001"


def test_layer001_triggers(tmp_path: Path) -> None:
    repo = tmp_path
    (repo / "pnpm-workspace.yaml").write_text("packages: []\n", encoding="utf-8")
    (repo / "package.json").write_text("{}", encoding="utf-8")
    fp = repo / "packages" / "ui-core" / "src" / "bad.tsx"
    fp.parent.mkdir(parents=True)
    ctx = ImportContext(
        repo_root=repo,
        file_path=fp,
        line=1,
        raw_import="@afenda/view-engine/widgets",
        source_segment="ui-core",
        normalized_afenda="@afenda/view-engine",
        resolved_relative=None,
    )
    rule = Layer001UiCoreNoViewEngine()
    v = list(rule.evaluate(ctx))
    assert len(v) == 1
    assert v[0].id == "LAYER_001"
    assert v[0].severity == "error"


def test_layer001_no_trigger_other_package(tmp_path: Path) -> None:
    repo = tmp_path
    fp = repo / "packages" / "view-engine" / "src" / "ok.tsx"
    fp.parent.mkdir(parents=True)
    ctx = ImportContext(
        repo_root=repo,
        file_path=fp,
        line=1,
        raw_import="@afenda/view-engine",
        source_segment="view-engine",
        normalized_afenda="@afenda/view-engine",
        resolved_relative=None,
    )
    v = list(Layer001UiCoreNoViewEngine().evaluate(ctx))
    assert v == []


def test_build_import_context_workspace_import(tmp_path: Path) -> None:
    repo = tmp_path
    fp = repo / "packages" / "ui-core" / "src" / "x.ts"
    fp.parent.mkdir(parents=True)
    fp.write_text("", encoding="utf-8")
    ctx = build_import_context(repo, fp, 3, "@afenda/erp-view-pack/foo")
    assert ctx.normalized_afenda == "@afenda/erp-view-pack"
    assert ctx.source_segment == "ui-core"


def test_registry_ids_unique() -> None:
    ids = [r.id for r in RULES]
    assert len(ids) == len(set(ids))
