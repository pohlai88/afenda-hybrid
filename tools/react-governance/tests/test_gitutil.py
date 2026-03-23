from react_governance.gitutil import normalize_git_base_ref


def test_normalize_git_base_ref_strips_heads() -> None:
    assert normalize_git_base_ref("refs/heads/main") == "main"
    assert normalize_git_base_ref("main") == "main"
    assert normalize_git_base_ref("  develop  ") == "develop"
