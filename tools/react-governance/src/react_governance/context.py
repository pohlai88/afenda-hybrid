from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ImportContext:
    """Per-import evaluation context."""

    repo_root: Path
    file_path: Path
    line: int
    raw_import: str
    """Literal specifier from source."""
    source_segment: str | None
    """packages/<name> first segment or web for apps/web."""
    normalized_afenda: str | None
    """@afenda/pkg after normalization, or None."""
    resolved_relative: Path | None
    """Absolute path if relative import resolved to a file."""
