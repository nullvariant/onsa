"""Check that a consumer pyproject.toml satisfies the expected ruff / mypy settings.

Usage: check_conformance.py PYPROJECT EXPECTED [EXPECTED ...]

Each EXPECTED file (e.g. ruff.expected.toml) lists the values a consumer must carry.
The comparison is a subset check: keys that appear in EXPECTED must exist in PYPROJECT
with the same value, while keys EXPECTED does not mention (files, mypy_path, extend-exclude,
mccabe, ...) are repository-specific and ignored. Lists are the exception, because a plain
equality check cannot tell a harmless addition from a weakened rule:

- "select" must contain every expected category; additional categories are allowed.
- every other list ("ignore", "unfixable", per-file-ignores rules) must hold exactly the
  expected entries, so a consumer cannot silently exempt more rules.
- extra per-file-ignores patterns and [[tool.mypy.overrides]] are not failures (the
  standard allows them when documented in the consumer's own authority document, which this
  script cannot verify), so they are reported as warnings.

Exit status: 0 when every EXPECTED file is satisfied, 1 otherwise, 2 on usage or I/O errors.
"""

from __future__ import annotations

import sys
import tomllib
from pathlib import Path

TomlValue = str | int | float | bool | list["TomlValue"] | dict[str, "TomlValue"]
Path_ = tuple[str, ...]

# Why a superset: the standard's category list is a floor, and a repository that adopts a
# framework adds categories on top of it immediately.
SUPERSET_LIST_PATHS: frozenset[Path_] = frozenset({("tool", "ruff", "lint", "select")})

# Why only a warning: extra patterns are legitimate when the consumer's own authority
# document names target, reason and release condition, which cannot be checked from here.
WARN_EXTRA_KEYS_PATHS: frozenset[Path_] = frozenset({("tool", "ruff", "lint", "per-file-ignores")})

MYPY_OVERRIDES_PATH: Path_ = ("tool", "mypy", "overrides")


def _dotted(path: Path_) -> str:
    return ".".join(path)


def _same_scalar(actual: TomlValue, expected: TomlValue) -> bool:
    # bool is a subclass of int, so `1 == True` would let `flag = 1` satisfy `flag = true`.
    return type(actual) is type(expected) and actual == expected


def _compare_list(
    path: Path_, expected: list[TomlValue], actual: TomlValue, errors: list[str]
) -> None:
    if not isinstance(actual, list):
        errors.append(f"{_dotted(path)}: {actual!r} is not a list (expected {expected!r})")
        return
    missing = [item for item in expected if item not in actual]
    if missing:
        errors.append(f"{_dotted(path)}: missing {missing!r}")
    if path not in SUPERSET_LIST_PATHS:
        extra = [item for item in actual if item not in expected]
        if extra:
            errors.append(f"{_dotted(path)}: unexpected {extra!r} (expected exactly {expected!r})")


def _compare(
    path: Path_,
    expected: TomlValue,
    actual: TomlValue,
    errors: list[str],
    warnings: list[str],
) -> None:
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            errors.append(f"{_dotted(path)}: missing (expected a table)")
            return
        for key, expected_value in expected.items():
            if key not in actual:
                errors.append(f"{_dotted((*path, key))}: missing (expected {expected_value!r})")
                continue
            _compare((*path, key), expected_value, actual[key], errors, warnings)
        if path in WARN_EXTRA_KEYS_PATHS:
            extra_keys = [key for key in actual if key not in expected]
            if extra_keys:
                warnings.append(
                    f"{_dotted(path)}: additional entries {extra_keys!r} are not part of the "
                    "expected set; they must be justified in the repository's own "
                    "authority document"
                )
    elif isinstance(expected, list):
        _compare_list(path, expected, actual, errors)
    elif not _same_scalar(actual, expected):
        errors.append(f"{_dotted(path)}: {actual!r} != {expected!r}")


def _lookup(table: dict[str, TomlValue], path: Path_) -> TomlValue | None:
    node: TomlValue | None = table
    for key in path:
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    return node


def check(
    expected: dict[str, TomlValue], actual: dict[str, TomlValue]
) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for one expected file against a parsed pyproject.toml."""
    errors: list[str] = []
    warnings: list[str] = []
    _compare((), expected, actual, errors, warnings)
    # Overrides are only relevant when this expected file is about mypy at all.
    if _lookup(expected, ("tool", "mypy")) is not None:
        overrides = _lookup(actual, MYPY_OVERRIDES_PATH)
        if overrides is not None:
            count = len(overrides) if isinstance(overrides, list) else 1
            warnings.append(
                f"{_dotted(MYPY_OVERRIDES_PATH)}: {count} override block(s) present; the "
                "standard allows them only as a temporary measure for existing violations"
            )
    return errors, warnings


def _label(expected_path: Path) -> str:
    return expected_path.name.removesuffix(".expected.toml")


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if len(args) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        with Path(args[0]).open("rb") as handle:
            actual = tomllib.load(handle)
    except (OSError, tomllib.TOMLDecodeError) as exc:
        print(f"::error::cannot read {args[0]}: {exc}", file=sys.stderr)
        return 2

    failed = False
    for expected_arg in args[1:]:
        expected_path = Path(expected_arg)
        try:
            with expected_path.open("rb") as handle:
                expected = tomllib.load(handle)
        except (OSError, tomllib.TOMLDecodeError) as exc:
            print(f"::error::cannot read {expected_arg}: {exc}", file=sys.stderr)
            return 2
        label = _label(expected_path)
        errors, warnings = check(expected, actual)
        for message in warnings:
            print(f"::warning::{label}: {message}")
        for message in errors:
            print(f"::error::{label}: {message}", file=sys.stderr)
        if errors:
            failed = True
        else:
            print(f"{label} config: all mandatory settings present")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
