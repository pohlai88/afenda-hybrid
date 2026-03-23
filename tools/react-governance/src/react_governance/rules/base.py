from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from react_governance.context import ImportContext
from react_governance.models import Violation


class Rule(ABC):
    """Registered governance rule."""

    @property
    @abstractmethod
    def id(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @property
    def default_severity(self) -> str:
        return "error"

    @abstractmethod
    def evaluate(self, ctx: ImportContext) -> Iterable[Violation]: ...

    def explain(self) -> str:
        """Longer text for `explain` subcommand."""
        return self.description
