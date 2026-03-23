from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from react_governance.engine import discover_repo_root, run_check, summarize
from react_governance.registry import RULES, rule_by_id


def _cmd_rules(_args: argparse.Namespace) -> int:
    for r in RULES:
        print(f"{r.id}\t{r.description}")
    return 0


def _cmd_explain(args: argparse.Namespace) -> int:
    rid = args.rule_id
    rule = rule_by_id(rid)
    if rule is None:
        print(f"react-governance: unknown rule id: {rid!r}", file=sys.stderr)
        print("Run: python -m react_governance rules", file=sys.stderr)
        return 2
    print(f"# {rule.id}")
    print()
    print(rule.explain())
    print()
    print(f"Default severity: {rule.default_severity}")
    return 0


def _print_text(violations: list, files_scanned: int) -> None:
    s = summarize(violations)
    print(
        f"Scanned {files_scanned} files. "
        f"Violations: {s['violations']} (errors={s['errors']}, warnings={s['warnings']}, info={s['infos']})"
    )
    for v in violations:
        print(f"{v.severity.upper()} {v.id} {v.file}:{v.line}: {v.message}")


def _print_json(violations: list, files_scanned: int) -> None:
    s = summarize(violations)
    payload = {
        "summary": {
            "files_scanned": files_scanned,
            "violations": s["violations"],
            "errors": s["errors"],
            "warnings": s["warnings"],
            "infos": s["infos"],
            "score": None,
        },
        "violations": [x.to_json_dict() for x in violations],
    }
    print(json.dumps(payload, indent=2))


def _run_eslint(repo_root: Path) -> int:
    """Run pnpm lint from monorepo root."""
    try:
        proc = subprocess.run(
            ["pnpm", "lint"],
            cwd=str(repo_root),
            check=False,
        )
        return int(proc.returncode)
    except OSError as e:
        print(f"react-governance: failed to run pnpm lint: {e}", file=sys.stderr)
        return 2


def _cmd_check(args: argparse.Namespace) -> int:
    repo = discover_repo_root(Path(args.root) if args.root else None)
    violations, nfiles = run_check(
        repo,
        changed_only=args.changed,
        base_ref=args.base or None,
    )
    fail_on_warn = args.fail_on_warn

    if args.json:
        _print_json(violations, nfiles)
    else:
        _print_text(violations, nfiles)

    s = summarize(violations)
    exit_code = 0
    if s["errors"] > 0:
        exit_code = 1
    elif fail_on_warn and s["warnings"] > 0:
        exit_code = 1

    if args.eslint:
        eslint_rc = _run_eslint(repo)
        if eslint_rc != 0:
            exit_code = max(exit_code, 1)
        if eslint_rc >= 2:
            exit_code = max(exit_code, 2)

    return exit_code


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="react-governance",
        description="AFENDA monorepo UI package-layer governance (read-only).",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_check = sub.add_parser("check", help="Run governance rules on TypeScript sources")
    p_check.add_argument(
        "--root",
        type=str,
        default="",
        help="Monorepo root (default: discover from cwd)",
    )
    p_check.add_argument("--json", action="store_true", help="Machine-readable output")
    p_check.add_argument(
        "--eslint",
        action="store_true",
        help="After checks, run `pnpm lint` from repo root",
    )
    p_check.add_argument(
        "--fail-on-warn",
        action="store_true",
        help="Exit non-zero if any WARNING rules fire (IMPORT_001, etc.)",
    )
    p_check.add_argument(
        "--changed",
        action="store_true",
        help="Only scan files changed vs main (git diff); falls back to full scan if git fails",
    )
    p_check.add_argument(
        "--base",
        type=str,
        default="",
        help="Git base ref for --changed (default: env GITHUB_BASE_REF or main)",
    )
    p_check.set_defaults(func=_cmd_check)

    p_rules = sub.add_parser("rules", help="List rule IDs")
    p_rules.set_defaults(func=_cmd_rules)

    p_exp = sub.add_parser("explain", help="Show documentation for a rule ID")
    p_exp.add_argument("rule_id", type=str, help="e.g. LAYER_001")
    p_exp.set_defaults(func=_cmd_explain)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
