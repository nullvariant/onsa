import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import config from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("stylelint-config exports", () => {
	it("exports a config object with extends", () => {
		expect(typeof config).toBe("object");
		expect(config.extends).toContain("stylelint-config-standard");
	});

	it("includes STD-00011 mandatory rules", () => {
		expect(config.rules!["no-duplicate-selectors"]).toBe(true);
		expect(config.rules!["color-no-invalid-hex"]).toBe(true);
		expect(config.rules!["declaration-block-no-duplicate-properties"]).toBe(
			true,
		);
		expect(config.rules!["no-descending-specificity"]).toBe(true);
	});

	it("allows :global pseudo-class for Astro/CSS Modules", () => {
		const rule = config.rules!["selector-pseudo-class-no-unknown"];
		expect(Array.isArray(rule)).toBe(true);
		const ruleArray = rule as [boolean, { ignorePseudoClasses: string[] }];
		expect(ruleArray[0]).toBe(true);
		expect(ruleArray[1].ignorePseudoClasses).toContain("global");
	});

	it("relaxes overly opinionated rules", () => {
		expect(config.rules!["custom-property-pattern"]).toBeNull();
		expect(config.rules!["selector-class-pattern"]).toBeNull();
	});
});

describe("stylelint-config consumer pattern", () => {
	it("config can be consumed by stylelint lint API", async () => {
		const stylelint = await import("stylelint");
		const validCss = "a { color: red; }\n";
		const result = await stylelint.default.lint({
			code: validCss,
			config,
			configBasedir: packageRoot,
		});
		expect(result.results[0].warnings).toHaveLength(0);
	});

	it("detects duplicate selectors", async () => {
		const stylelint = await import("stylelint");
		const invalidCss = "a { color: red; }\na { color: blue; }\n";
		const result = await stylelint.default.lint({
			code: invalidCss,
			config,
			configBasedir: packageRoot,
		});
		const duplicateWarning = result.results[0].warnings.find(
			(w) => w.rule === "no-duplicate-selectors",
		);
		expect(duplicateWarning).toBeDefined();
	});
});
