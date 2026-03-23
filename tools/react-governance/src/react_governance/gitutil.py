from __future__ import annotations

import os
import subprocess
from pathlib import Path


def normalize_git_base_ref(base: str) -> str:
    """Strip refs/heads/ (GitHub Actions sometimes sets full ref)."""
    b = base.strip()
    prefix = "refs/heads/"
    if b.startswith(prefix):
        return b[len(prefix) :]
    return b


def git_changed_paths(repo_root: Path, base_ref: str | None = None) -> set[str] | None:
    """
    Return set of repo-relative posix paths changed vs base ref.
    None if git unavailable or diff failed.
    """
    raw = base_ref or os.environ.get("GITHUB_BASE_REF") or "main"
    base = normalize_git_base_ref(raw)
    # refs like "main" -> try origin/main if main...HEAD is empty on fresh clone
    candidates = [base, f"origin/{base}", "HEAD~1"]
    repo_root = repo_root.resolve()
    for ref in candidates:
        cmd = ["git", "-C", str(repo_root), "diff", "--name-only", f"{ref}...HEAD"]
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            return None
        if proc.returncode != 0:
            continue
        paths = {p.strip().replace("\\", "/") for p in proc.stdout.splitlines() if p.strip()}
        if paths or ref == candidates[-1]:
            return paths
    return set()
