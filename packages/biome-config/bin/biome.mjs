#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const biomePath = require.resolve("@biomejs/biome/bin/biome");
try {
	execFileSync(process.execPath, [biomePath, ...process.argv.slice(2)], {
		stdio: "inherit",
	});
} catch (error) {
	if (error.status === undefined || error.status === null) {
		console.error(error.message);
	}
	process.exit(error.status ?? 1);
}
