from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Violation:
    id: str
    severity: str  # error | warn | info
    file: str
    line: int
    message: str
    import_spec: str | None = None

    def to_json_dict(self) -> dict:
        d = asdict(self)
        # stable key name for JSON consumers
        return {
            "id": d["id"],
            "severity": d["severity"],
            "file": d["file"],
            "line": d["line"],
            "message": d["message"],
            "import": d["import_spec"],
        }
