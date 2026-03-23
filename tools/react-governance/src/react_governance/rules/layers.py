from __future__ import annotations

from pathlib import Path
from typing import Iterable

from react_governance.context import ImportContext
from react_governance.models import Violation
from react_governance.normalize import path_under_apps_web, path_under_packages
from react_governance.rules.base import Rule


def _rel_file(repo: Path, f: Path) -> str:
    return str(f.resolve().relative_to(repo.resolve())).replace("\\", "/")


class Layer001UiCoreNoViewEngine(Rule):
    @property
    def id(self) -> str:
        return "LAYER_001"

    @property
    def description(self) -> str:
        return "packages/ui-core must not import @afenda/view-engine"

    def explain(self) -> str:
        return (
            "The design system base (`@afenda/ui-core`) must stay below the metadata view layer. "
            "Imports of `@afenda/view-engine` from ui-core invert the dependency graph and cause "
            "cycles. Use composition in `view-engine` or `erp-view-pack`, or move shared primitives "
            "into ui-core only."
        )

    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]:
        if ctx.source_segment != "ui-core":
            return
        if ctx.normalized_afenda == "@afenda/view-engine":
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=f"{self.description}: {ctx.raw_import!r}",
                import_spec=ctx.raw_import,
            )


class Layer002UiCoreNoErpPack(Rule):
    @property
    def id(self) -> str:
        return "LAYER_002"

    @property
    def description(self) -> str:
        return "packages/ui-core must not import @afenda/erp-view-pack"

    def explain(self) -> str:
        return (
            "ERP-specific chrome belongs in `@afenda/erp-view-pack`. ui-core must remain generic "
            "so other apps and packages can reuse primitives without ERP coupling."
        )

    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]:
        if ctx.source_segment != "ui-core":
            return
        if ctx.normalized_afenda == "@afenda/erp-view-pack":
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=f"{self.description}: {ctx.raw_import!r}",
                import_spec=ctx.raw_import,
            )


class Layer003ViewEngineNoErpPack(Rule):
    @property
    def id(self) -> str:
        return "LAYER_003"

    @property
    def description(self) -> str:
        return "packages/view-engine must not import @afenda/erp-view-pack"

    def explain(self) -> str:
        return (
            "view-engine implements metadata-driven views for any domain. erp-view-pack is the ERP "
            "adapter layer and must sit above view-engine, not the reverse."
        )

    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]:
        if ctx.source_segment != "view-engine":
            return
        if ctx.normalized_afenda == "@afenda/erp-view-pack":
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=f"{self.description}: {ctx.raw_import!r}",
                import_spec=ctx.raw_import,
            )


class Layer004PackagesNoAppsWeb(Rule):
    @property
    def id(self) -> str:
        return "LAYER_004"

    @property
    def description(self) -> str:
        return "packages/* must not import from apps/web"

    def explain(self) -> str:
        return (
            "Application code in `apps/web` may compose workspace packages, but library packages "
            "must not depend on the app. Move shared code into a package or pass data via props."
        )

    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]:
        if not path_under_packages(ctx.repo_root, ctx.file_path):
            return
        raw = ctx.raw_import.replace("\\", "/")
        if "apps/web" in raw or raw.startswith("apps/web"):
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=f"{self.description}: {ctx.raw_import!r}",
                import_spec=ctx.raw_import,
            )
            return
        if ctx.resolved_relative and path_under_apps_web(ctx.repo_root, ctx.resolved_relative):
            yield Violation(
                id=self.id,
                severity=self.default_severity,
                file=_rel_file(ctx.repo_root, ctx.file_path),
                line=ctx.line,
                message=f"{self.description}: resolves to apps/web via {ctx.raw_import!r}",
                import_spec=ctx.raw_import,
            )
