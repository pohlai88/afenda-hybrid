from __future__ import annotations

from react_governance.rules.base import Rule
from react_governance.rules.imports_relative import DeepRelativeCrossPackageRule
from react_governance.rules.layers import (
    Layer001UiCoreNoViewEngine,
    Layer002UiCoreNoErpPack,
    Layer003ViewEngineNoErpPack,
    Layer004PackagesNoAppsWeb,
)

RULES: list[Rule] = [
    Layer001UiCoreNoViewEngine(),
    Layer002UiCoreNoErpPack(),
    Layer003ViewEngineNoErpPack(),
    Layer004PackagesNoAppsWeb(),
    DeepRelativeCrossPackageRule(),
]


def rule_by_id(rule_id: str) -> Rule | None:
    rid = rule_id.strip().upper()
    for r in RULES:
        if r.id.upper() == rid:
            return r
    return None
