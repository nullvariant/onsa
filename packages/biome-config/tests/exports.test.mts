import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageRoot, "../..");

describe("biome-config exports", () => {
	it("biome.json has the complete expected configuration", () => {
		const raw = readFileSync(resolve(packageRoot, "biome.json"), "utf8");
		const config = JSON.parse(raw);
		expect(config.formatter.enabled).toBe(true);
		expect(config.formatter.indentStyle).toBe("tab");
		expect(config.formatter.indentWidth).toBe(2);
		expect(config.formatter.lineWidth).toBe(80);
		expect(config.formatter.lineEnding).toBe("lf");
		expect(config.javascript.formatter.quoteStyle).toBe("double");
		expect(config.javascript.formatter.semicolons).toBe("always");
		expect(config.javascript.formatter.trailingCommas).toBe("all");
		expect(config.linter.enabled).toBe(false);
		expect(config.assist.enabled).toBe(false);
	});
});

describe("biome-config consumer pattern", () => {
	it("bin/biome.mjs is executable and responds to --version", () => {
		const binPath = resolve(packageRoot, "bin/biome.mjs");
		const result = execFileSync(process.execPath, [binPath, "--version"], {
			encoding: "utf8",
			timeout: 10_000,
		});
		const parts = result.trim().split(".").filter(Boolean);
		expect(parts.length).toBeGreaterThanOrEqual(3);
	});

	it("biome format applies quoteStyle: double from config", () => {
		const binPath = resolve(packageRoot, "bin/biome.mjs");
		const sampleCode = "const x = 'hello';\n";
		const result = execFileSync(
			process.execPath,
			[
				binPath,
				"format",
				"--config-path",
				repoRoot,
				"--stdin-file-path",
				"sample.js",
			],
			{ input: sampleCode, encoding: "utf8", timeout: 10_000 },
		);
		expect(result).toContain('"hello"');
	});
});
