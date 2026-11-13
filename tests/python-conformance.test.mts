import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const pythonConfigsDir = resolve(import.meta.dirname, "../configs/python");
const checker = join(pythonConfigsDir, "check_conformance.py");
const ruffExpectedPath = join(pythonConfigsDir, "ruff.expected.toml");
const mypyExpectedPath = join(pythonConfigsDir, "mypy.expected.toml");

// The expected files are the minimal conforming pyproject.toml: they have no
// overlapping tables, so concatenating them yields a valid consumer file
// without repeating any expected value in this test.
const conformingPyproject = `${readFileSync(ruffExpectedPath, "utf8")}\n${readFileSync(mypyExpectedPath, "utf8")}`;

let workDir: string;
let fixtureCount = 0;

beforeAll(() => {
	workDir = mkdtempSync(join(tmpdir(), "onsa-python-conformance-"));
});

afterAll(() => {
	rmSync(workDir, { recursive: true, force: true });
});

// The checker runs inside the consumer CI under the interpreter that setup-python puts on
// PATH, so the tests use the same lookup rather than a hard-coded absolute path.
function runPython(args: string[]) {
	// eslint-disable-next-line sonarjs/no-os-command-from-path -- same PATH lookup as the CI job
	return spawnSync("python3", args, { encoding: "utf8" });
}

function runChecker(
	pyproject: string,
	expectedPaths: string[] = [ruffExpectedPath, mypyExpectedPath],
) {
	fixtureCount += 1;
	const target = join(workDir, `pyproject-${fixtureCount}.toml`);
	writeFileSync(target, pyproject);
	const result = runPython([checker, target, ...expectedPaths]);
	return {
		status: result.status,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}

function replaceOnce(source: string, search: string, replacement: string) {
	expect(source).toContain(search);
	return source.replace(search, replacement);
}

describe("check_conformance.py: files the standard's settings are checked against", () => {
	it("ruff expected file carries the 48 select categories of the unified ruleset", () => {
		const content = readFileSync(ruffExpectedPath, "utf8");
		const selectBlock = /select = \[\n([\s\S]*?)\]/.exec(content);
		expect(selectBlock).not.toBeNull();
		const categories = (selectBlock?.[1] ?? "").match(/"[A-Z0-9]+"/g) ?? [];
		expect(categories).toHaveLength(48);
	});
});

describe("check_conformance.py: conforming settings", () => {
	it("accepts a minimal pyproject that carries exactly the expected values", () => {
		const result = runChecker(conformingPyproject);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(
			"ruff config: all mandatory settings present",
		);
		expect(result.stdout).toContain(
			"mypy config: all mandatory settings present",
		);
	});

	it("accepts repository-specific keys that the expected files do not mention", () => {
		let pyproject = conformingPyproject;
		pyproject = replaceOnce(
			pyproject,
			'target-version = "py311"',
			'target-version = "py311"\nextend-exclude = ["__pycache__", "scripts/_scratch"]',
		);
		pyproject = replaceOnce(
			pyproject,
			"[tool.mypy]\n",
			'[tool.mypy]\npython_version = "3.11"\nmypy_path = "src"\nfiles = ["src", "tests"]\nexplicit_package_bases = true\n',
		);
		pyproject += "\n[tool.ruff.lint.mccabe]\nmax-complexity = 10\n";
		pyproject += '\n[tool.pytest.ini_options]\ntestpaths = ["tests"]\n';
		const result = runChecker(pyproject);
		expect(result.status).toBe(0);
		expect(result.stderr).toBe("");
	});

	it("accepts extra select categories", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"select = [\n",
			'select = [\n    "AIR",\n',
		);
		expect(runChecker(pyproject).status).toBe(0);
	});

	it("accepts select categories in a different order", () => {
		const pyproject = replaceOnce(
			replaceOnce(conformingPyproject, '    "A",\n', ""),
			'    "YTT",\n',
			'    "YTT",\n    "A",\n',
		);
		expect(runChecker(pyproject).status).toBe(0);
	});

	it("accepts extra per-file-ignores patterns but reports them as a warning", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			'"tests/**/*.py" = ["S101", "S108", "T20"]\n',
			'"tests/**/*.py" = ["S101", "S108", "T20"]\n"scripts/facade.py" = ["PLC0414"]\n',
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("::warning::ruff:");
		expect(result.stdout).toContain("scripts/facade.py");
	});

	it("accepts mypy overrides but reports them as a warning", () => {
		const pyproject = `${conformingPyproject}\n[[tool.mypy.overrides]]\nmodule = "legacy.*"\ndisallow_any_explicit = false\n`;
		const result = runChecker(pyproject);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(
			"::warning::mypy: tool.mypy.overrides: 1 override",
		);
	});

	it("does not report mypy overrides when only the ruff expected file is checked", () => {
		const pyproject = `${conformingPyproject}\n[[tool.mypy.overrides]]\nmodule = "legacy.*"\ndisallow_any_explicit = false\n`;
		const result = runChecker(pyproject, [ruffExpectedPath]);
		expect(result.status).toBe(0);
		expect(result.stdout).not.toContain("overrides");
	});
});

describe("check_conformance.py: missing mandatory settings", () => {
	it("fails when a select category is missing", () => {
		const pyproject = replaceOnce(conformingPyproject, '    "TRY",\n', "");
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"::error::ruff: tool.ruff.lint.select: missing ['TRY']",
		);
	});

	it("fails when select is absent altogether", () => {
		const pyproject = conformingPyproject.replace(
			/select = \[\n[\s\S]*?\]\n/,
			"",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("tool.ruff.lint.select: missing");
	});

	it("fails when a ruff scalar differs", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"line-length = 100",
			"line-length = 88",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("tool.ruff.line-length: 88 != 100");
	});

	it("fails when a format setting differs", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			'quote-style = "double"',
			'quote-style = "single"',
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("tool.ruff.format.quote-style");
	});

	it("fails when a mypy flag is missing", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"strict_bytes = true\n",
			"",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"::error::mypy: tool.mypy.strict_bytes: missing",
		);
	});

	it("fails when a mypy flag is false", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"disallow_any_explicit = true",
			"disallow_any_explicit = false",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"tool.mypy.disallow_any_explicit: False != True",
		);
	});

	it("fails when a mypy flag is an integer instead of a boolean", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"extra_checks = true",
			"extra_checks = 1",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("tool.mypy.extra_checks: 1 != True");
	});

	it("fails when the mypy table is absent", () => {
		const pyproject = readFileSync(ruffExpectedPath, "utf8");
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("::error::mypy: tool.mypy: missing");
	});

	it("reports every failing expected file, not just the first", () => {
		let pyproject = replaceOnce(conformingPyproject, '    "TRY",\n', "");
		pyproject = replaceOnce(pyproject, "strict_bytes = true\n", "");
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("::error::ruff:");
		expect(result.stderr).toContain("::error::mypy:");
	});
});

describe("check_conformance.py: weakened exemptions", () => {
	it("fails when ignore gains a rule", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			"ignore = [\n",
			'ignore = [\n    "PLR2004",\n',
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"tool.ruff.lint.ignore: unexpected ['PLR2004']",
		);
	});

	it("fails when ignore loses a rule", () => {
		const pyproject = replaceOnce(conformingPyproject, '    "RUF003",\n', "");
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"tool.ruff.lint.ignore: missing ['RUF003']",
		);
	});

	it("fails when unfixable gains a rule", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			'unfixable = ["F541"]',
			'unfixable = ["F541", "F401"]',
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"tool.ruff.lint.unfixable: unexpected ['F401']",
		);
	});

	it("fails when the shared tests pattern gains a rule", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			'"tests/**/*.py" = ["S101", "S108", "T20"]',
			'"tests/**/*.py" = ["S101", "S108", "T20", "SLF001"]',
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"per-file-ignores.tests/**/*.py: unexpected ['SLF001']",
		);
	});

	it("fails when the shared tests pattern is missing", () => {
		const pyproject = replaceOnce(
			conformingPyproject,
			'"tests/**/*.py" = ["S101", "S108", "T20"]\n',
			"",
		);
		const result = runChecker(pyproject);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"tool.ruff.lint.per-file-ignores.tests/**/*.py: missing",
		);
	});
});

describe("check_conformance.py: invocation errors", () => {
	it("exits 2 when called without an expected file", () => {
		const result = runPython([checker, "pyproject.toml"]);
		expect(result.status).toBe(2);
	});

	it("exits 2 when the pyproject file cannot be read", () => {
		const result = runPython([
			checker,
			join(workDir, "absent.toml"),
			ruffExpectedPath,
		]);
		expect(result.status).toBe(2);
		expect(result.stderr).toContain("::error::cannot read");
	});

	it("exits 2 when the pyproject file is not valid TOML", () => {
		const result = runChecker("this is = = not toml", [ruffExpectedPath]);
		expect(result.status).toBe(2);
		expect(result.stderr).toContain("::error::cannot read");
	});
});
