import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const configFiles = ["base.json", "node.json", "cloudflare-worker.json"];

describe("tsconfig exports", () => {
	for (const file of configFiles) {
		it(`${file} exists and is valid JSON`, () => {
			const filePath = resolve(packageRoot, file);
			expect(existsSync(filePath)).toBe(true);
			const raw = readFileSync(filePath, "utf8");
			const config = JSON.parse(raw);
			expect(typeof config).toBe("object");
		});
	}

	it("base.json has strict mode enabled", () => {
		const raw = readFileSync(resolve(packageRoot, "base.json"), "utf8");
		const config = JSON.parse(raw);
		expect(config.compilerOptions.strict).toBe(true);
	});

	it("base.json targets ES2022", () => {
		const raw = readFileSync(resolve(packageRoot, "base.json"), "utf8");
		const config = JSON.parse(raw);
		expect(config.compilerOptions.target).toBe("ES2022");
	});

	it("node.json extends base.json with Node16 module resolution", () => {
		const raw = readFileSync(resolve(packageRoot, "node.json"), "utf8");
		const config = JSON.parse(raw);
		expect(config.extends).toBe("./base.json");
		expect(config.compilerOptions.module).toBe("Node16");
		expect(config.compilerOptions.moduleResolution).toBe("Node16");
	});

	it("cloudflare-worker.json extends base.json with workers types", () => {
		const raw = readFileSync(
			resolve(packageRoot, "cloudflare-worker.json"),
			"utf8",
		);
		const config = JSON.parse(raw);
		expect(config.extends).toBe("./base.json");
		expect(config.compilerOptions.types).toContain("@cloudflare/workers-types");
	});
});

describe("tsconfig package.json exports mapping", () => {
	it("package.json exports all config files", () => {
		const raw = readFileSync(resolve(packageRoot, "package.json"), "utf8");
		const pkg = JSON.parse(raw);
		for (const file of configFiles) {
			const exportKey = `./${file}`;
			expect(pkg.exports[exportKey]).toBe(`./${file}`);
		}
	});
});
