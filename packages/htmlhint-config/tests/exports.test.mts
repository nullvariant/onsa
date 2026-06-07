import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import config from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("htmlhint-config exports", () => {
	it("exports a rules object from the programmatic API", () => {
		expect(typeof config).toBe("object");
		expect(config["doctype-first"]).toBe(true);
		expect(config["tag-pair"]).toBe(true);
		expect(config["alt-require"]).toBe(true);
	});

	it("allows inline scripts, styles, and head scripts for Astro compatibility", () => {
		expect(config["inline-script-disabled"]).toBe(false);
		expect(config["inline-style-disabled"]).toBe(false);
		expect(config["head-script-disabled"]).toBe(false);
	});
});

describe("htmlhint-config .htmlhintrc", () => {
	it(".htmlhintrc is valid JSON matching the programmatic export", () => {
		const raw = readFileSync(resolve(packageRoot, ".htmlhintrc"), "utf8");
		const fileConfig = JSON.parse(raw);
		expect(fileConfig).toEqual(config);
	});
});

describe("htmlhint-config consumer pattern", () => {
	it("valid HTML passes HTMLHint verification", async () => {
		const { HTMLHint } = await import("htmlhint");
		const validHtml = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><img src="test.png" alt="test"></body>
</html>`;
		const messages = HTMLHint.verify(validHtml, config);
		expect(messages).toHaveLength(0);
	});

	it("HTML without doctype triggers an error", async () => {
		const { HTMLHint } = await import("htmlhint");
		const invalidHtml = `<html lang="en">
<head><title>Test</title></head>
<body></body>
</html>`;
		const messages = HTMLHint.verify(invalidHtml, config);
		const doctypeError = messages.find((m) => m.rule.id === "doctype-first");
		expect(doctypeError).toBeDefined();
	});
});
