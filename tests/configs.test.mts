import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "..");
const configsDir = resolve(repoRoot, "configs");

describe("configs/gitignore/security-baseline.gitignore", () => {
	const baselinePath = resolve(
		configsDir,
		"gitignore/security-baseline.gitignore",
	);

	it("exists", () => {
		expect(existsSync(baselinePath)).toBe(true);
	});

	it("contains STD-00020 header comment", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("Security baseline (STD-00020)");
	});

	it("contains secret file insurance patterns (STD-00020 R3)", () => {
		const content = readFileSync(baselinePath, "utf8");
		const requiredPatterns = [
			"**/.env",
			"**/*.pem",
			"**/*.key",
			"**/id_rsa",
			"**/id_ed25519",
			"**/credentials",
			"**/.git-credentials",
			"**/service_account*.json",
			"**/secret.yaml",
			"**/.aws/config",
			"**/.credentials/",
			"**/sensitive/",
		];
		for (const pattern of requiredPatterns) {
			expect(content).toContain(pattern);
		}
	});

	it("contains OS generated file patterns", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("**/.DS_Store");
		expect(content).toContain("**/Thumbs.db");
	});

	it("contains Node.js patterns", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("**/node_modules/");
		expect(content).toContain("**/*.tsbuildinfo");
	});

	it("contains Python patterns", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("**/__pycache__/");
		expect(content).toContain("**/.mypy_cache/");
		expect(content).toContain("**/.ruff_cache/");
	});

	it("contains build output and coverage patterns", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("**/dist/");
		expect(content).toContain("**/coverage/");
	});

	it("ends with project-specific exclusions marker", () => {
		const content = readFileSync(baselinePath, "utf8");
		expect(content).toContain("Project-specific exclusions (add below)");
	});

	it("uses **/ prefix consistently for all patterns (STD-00020 R3)", () => {
		const content = readFileSync(baselinePath, "utf8");
		const lines = content.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (
				trimmed === "" ||
				trimmed.startsWith("#") ||
				trimmed.startsWith("=")
			) {
				continue;
			}
			expect(trimmed).toMatch(/^\*\*\//);
		}
	});
});

describe("configs/gitleaks/.gitleaks.toml", () => {
	const gitleaksPath = resolve(configsDir, "gitleaks/.gitleaks.toml");

	it("exists", () => {
		expect(existsSync(gitleaksPath)).toBe(true);
	});

	it("extends default rules", () => {
		const content = readFileSync(gitleaksPath, "utf8");
		expect(content).toContain("useDefault = true");
	});

	it("defines npmrc-github-token rule", () => {
		const content = readFileSync(gitleaksPath, "utf8");
		expect(content).toContain('id = "npmrc-github-token"');
	});

	it("defines npmrc-npm-token rule", () => {
		const content = readFileSync(gitleaksPath, "utf8");
		expect(content).toContain('id = "npmrc-npm-token"');
	});
});

describe("configs/python/ruff.expected.toml", () => {
	const ruffPath = resolve(configsDir, "python/ruff.expected.toml");

	it("exists", () => {
		expect(existsSync(ruffPath)).toBe(true);
	});

	it("defines target-version and line-length", () => {
		const content = readFileSync(ruffPath, "utf8");
		expect(content).toContain('target-version = "py311"');
		expect(content).toContain("line-length = 100");
	});

	it("defines format settings", () => {
		const content = readFileSync(ruffPath, "utf8");
		expect(content).toContain('quote-style = "double"');
		expect(content).toContain('indent-style = "space"');
		expect(content).toContain('line-ending = "lf"');
	});

	it("defines lint select and ignore rules", () => {
		const content = readFileSync(ruffPath, "utf8");
		expect(content).toContain(
			'select = ["B", "D3", "E", "F", "I", "S", "UP", "RUF"]',
		);
		expect(content).toContain('ignore = ["E501"]');
	});
});

describe("configs/python/mypy.expected.toml", () => {
	const mypyPath = resolve(configsDir, "python/mypy.expected.toml");

	it("exists", () => {
		expect(existsSync(mypyPath)).toBe(true);
	});

	it("includes all strict-equivalent flags", () => {
		const content = readFileSync(mypyPath, "utf8");
		const requiredFlags = [
			"warn_unused_configs = true",
			"disallow_any_generics = true",
			"disallow_subclassing_any = true",
			"disallow_untyped_calls = true",
			"disallow_untyped_defs = true",
			"disallow_incomplete_defs = true",
			"check_untyped_defs = true",
			"disallow_untyped_decorators = true",
			"warn_redundant_casts = true",
			"warn_unused_ignores = true",
			"warn_return_any = true",
			"no_implicit_reexport = true",
			"strict_equality = true",
			"strict_bytes = true",
			"extra_checks = true",
		];
		for (const flag of requiredFlags) {
			expect(content).toContain(flag);
		}
	});

	it("includes Any bypass prohibition flags", () => {
		const content = readFileSync(mypyPath, "utf8");
		expect(content).toContain("disallow_any_explicit = true");
		expect(content).toContain("disallow_any_unimported = true");
	});
});
