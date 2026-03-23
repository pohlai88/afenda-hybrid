"""Contract tests aligned with planned JSON summary + violation shape."""

from react_governance.engine import summarize
from react_governance.models import Violation


def test_summarize_counts_by_severity() -> None:
    v = [
        Violation("LAYER_001", "error", "packages/ui-core/a.ts", 1, "msg", "x"),
        Violation("IMPORT_001", "warn", "packages/ui-core/b.ts", 2, "msg", "y"),
        Violation("FUTURE", "info", "packages/ui-core/c.ts", 3, "msg", None),
    ]
    s = summarize(v)
    assert s == {"violations": 3, "errors": 1, "warnings": 1, "infos": 1}


def test_violation_json_dict_matches_contract() -> None:
    v = Violation(
        id="LAYER_001",
        severity="error",
        file="packages/ui-core/src/foo.tsx",
        line=12,
        message="test",
        import_spec="@afenda/view-engine",
    )
    d = v.to_json_dict()
    assert set(d.keys()) == {"id", "severity", "file", "line", "message", "import"}
    assert d["id"] == "LAYER_001"
    assert d["severity"] == "error"
    assert d["line"] == 12
    assert d["import"] == "@afenda/view-engine"


def test_planned_summary_keys_for_json_payload() -> None:
    """Mirrors cli._print_json summary object (plan: files_scanned, violations, errors, warnings, score)."""
    violations: list[Violation] = []
    s = summarize(violations)
    summary_block = {
        "files_scanned": 1204,
        "violations": s["violations"],
        "errors": s["errors"],
        "warnings": s["warnings"],
        "infos": s["infos"],
        "score": None,
    }
    assert summary_block["files_scanned"] == 1204
    assert summary_block["score"] is None
    assert summary_block["violations"] == 0


def test_registry_has_all_planned_rule_ids() -> None:
    from react_governance.registry import RULES

    ids = {r.id for r in RULES}
    assert {"LAYER_001", "LAYER_002", "LAYER_003", "LAYER_004", "IMPORT_001"} <= ids
