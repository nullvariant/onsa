import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["packages/*/tests/**/*.test.{ts,mts}"],
		coverage: {
			provider: "v8",
			include: ["packages/*/index.mjs"],
			reporter: ["text", "lcov"],
		},
	},
});
