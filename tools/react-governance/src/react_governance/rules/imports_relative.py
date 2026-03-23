from __future__ import annotations

from pathlib import Path
from typing import Iterable

from react_governance.context import ImportContext
from react_governance.models import Violation
from react_governance.normalize import (
    is_relative_import,
    package_segment_for_path,
    path_under_packages,
)
from react_governance.rules.base import Rule


def _rel_file(repo: Path, f: Path) -> str:
    return str(f.resolve().relative_to(repo.resolve())).replace("\\", "/")


class DeepRelativeCrossPackageRule(Rule):
    """
    IMPORT_001: relative import that resolves into a different workspace package (heuristic).
    Severity: warn — may include intentional internal tooling paths; tighten in Phase 2.
    """

    @property
    def id(self) -> str:
        return "IMPORT_001"

    @property
    def description(self) -> str:
        return "Relative import resolves to a different packages/* root (prefer workspace aliases)"

    @property
    def default_severity(self) -> str:
        return "warn"

    def explain(self) -> str:
        return (
            "Relative paths that jump from one `packages/<name>` tree into another are brittle and "
            "bypass the public package API. Prefer `@afenda/...` workspace imports. "
            "v1 uses path resolution only; TypeScript `paths` aliases are not fully resolved."
        )

    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]:
        if ctx.source_segment is None:
            return
        if not path_under_packages(ctx.repo_root, ctx.file_path):
            return
        if not is_relative_import(ctx.raw_import):
            return
        if ctx.resolved_relative is None:
            return
        target = package_segment_for_path(ctx.repo_root, ctx.resolved_relative)
        if target is None:
            return
        # Same top-level package folder (e.g. ui-core/src/a -> ui-core/src/b)
        if target == ctx.source_segment:
            return
        # Resolved under another packages/<name>
        try:
            rel = ctx.resolved_relative.resolve().relative_to(ctx.repo_root.resolve())
        except ValueError:
            return
        parts = rel.parts
        if len(parts) >= 2 and parts[0] == "packages":
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=(
                    f"Cross-package relative import from packages/{ctx.source_segment} "
                    f"into packages/{target}: {ctx.raw_import!r}"
                ),
                import_spec=ctx.raw_import,
            )
