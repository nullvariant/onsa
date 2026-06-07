import { describe, expect, it } from "vitest";

import { astro, base, react, security, test, typescript } from "../index.mjs";

describe("eslint-config named exports", () => {
	it("exports base as a non-empty config array", () => {
		expect(Array.isArray(base)).toBe(true);
		expect(base.length).toBeGreaterThan(0);
	});

	it("exports typescript as a non-empty config array", () => {
		expect(Array.isArray(typescript)).toBe(true);
		expect(typescript.length).toBeGreaterThan(0);
	});

	it("exports security as a non-empty config array", () => {
		expect(Array.isArray(security)).toBe(true);
		expect(security.length).toBeGreaterThan(0);
	});

	it("exports react as a non-empty config array", () => {
		expect(Array.isArray(react)).toBe(true);
		expect(react.length).toBeGreaterThan(0);
	});

	it("exports astro as a non-empty config array", () => {
		expect(Array.isArray(astro)).toBe(true);
		expect(astro.length).toBeGreaterThan(0);
	});

	it("exports test as a non-empty config array", () => {
		expect(Array.isArray(test)).toBe(true);
		expect(test.length).toBeGreaterThan(0);
	});
});

describe("eslint-config consumer pattern", () => {
	it("configs can be spread into a flat config array", () => {
		const combined = [...base, ...typescript, ...security, ...test];
		expect(Array.isArray(combined)).toBe(true);
		expect(combined.length).toBeGreaterThan(0);
		for (const entry of combined) {
			expect(typeof entry).toBe("object");
		}
	});

	it("base config includes expected rule keys", () => {
		const rulesEntry = base.find(
			(entry) => entry.rules && "no-var" in entry.rules,
		);
		expect(rulesEntry).toBeDefined();
		expect(rulesEntry!.rules!["no-var"]).toBe("error");
		expect(rulesEntry!.rules!["prefer-const"]).toBe("error");
		expect(rulesEntry!.rules!.eqeqeq).toBe("error");
	});

	it("typescript config includes @typescript-eslint rules", () => {
		const rulesEntry = typescript.find(
			(entry) =>
				entry.rules && "@typescript-eslint/no-explicit-any" in entry.rules,
		);
		expect(rulesEntry).toBeDefined();
		expect(rulesEntry!.rules!["@typescript-eslint/no-explicit-any"]).toBe(
			"error",
		);
	});

	it("test config targets all test file patterns including tsx", () => {
		const testEntry = test.find((entry) => entry.files);
		expect(testEntry).toBeDefined();
		expect(testEntry!.files).toEqual(
			expect.arrayContaining([
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/*.spec.ts",
				"**/*.spec.tsx",
			]),
		);
		expect(testEntry!.files).toHaveLength(4);
	});
});
