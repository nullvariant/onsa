import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const repoRoot = resolve(import.meta.dirname, "..");
const workflowDir = resolve(repoRoot, ".github/workflows");

function loadWorkflow(name: string) {
	const filePath = resolve(workflowDir, name);
	const raw = readFileSync(filePath, "utf8");
	return parse(raw);
}

describe("ci.yml", () => {
	it("exists and is valid YAML", () => {
		const workflow = loadWorkflow("ci.yml");
		expect(typeof workflow).toBe("object");
		expect(workflow.name).toBe("CI");
	});

	it("triggers on workflow_call only", () => {
		const workflow = loadWorkflow("ci.yml");
		expect(workflow.on).toHaveProperty("workflow_call");
		expect(Object.keys(workflow.on)).toEqual(["workflow_call"]);
	});

	it("defines expected inputs with correct types", () => {
		const workflow = loadWorkflow("ci.yml");
		const inputs = workflow.on.workflow_call.inputs;

		expect(inputs["node-version"].type).toBe("string");
		expect(inputs["node-version"].default).toBe("24");

		expect(inputs["test-command"].type).toBe("string");
		expect(inputs["test-command"].default).toBe("pnpm test");

		expect(inputs["has-python"].type).toBe("boolean");
		expect(inputs["has-python"].default).toBe(false);
	});

	it("has top-level read-only permissions", () => {
		const workflow = loadWorkflow("ci.yml");
		expect(workflow.permissions).toEqual({ contents: "read" });
	});

	it("defines lint, typecheck, test, and gitignore-conformance jobs", () => {
		const workflow = loadWorkflow("ci.yml");
		const jobNames = Object.keys(workflow.jobs);
		expect(jobNames).toContain("lint");
		expect(jobNames).toContain("typecheck");
		expect(jobNames).toContain("test");
		expect(jobNames).toContain("gitignore-conformance");
	});

	it("defines python-config-conformance job gated by has-python input", () => {
		const workflow = loadWorkflow("ci.yml");
		const job = workflow.jobs["python-config-conformance"];
		expect(job).toBeDefined();
		expect(job.if).toContain("inputs.has-python");
	});

	it("every job has harden-runner as first step (except container jobs)", () => {
		const workflow = loadWorkflow("ci.yml");
		for (const [, job] of Object.entries<Record<string, unknown>>(
			workflow.jobs,
		)) {
			const steps = (job as { steps: Array<{ uses?: string }> }).steps;
			const firstStep = steps[0];
			expect(firstStep.uses).toContain("step-security/harden-runner@");
		}
	});

	it("all third-party actions use SHA pinning", () => {
		const workflow = loadWorkflow("ci.yml");
		for (const [, job] of Object.entries<Record<string, unknown>>(
			workflow.jobs,
		)) {
			for (const step of (job as { steps: Array<{ uses?: string }> }).steps) {
				if (step.uses) {
					expect(step.uses).toMatch(/@[0-9a-f]{40}/);
				}
			}
		}
	});
});

describe("security.yml", () => {
	it("exists and is valid YAML", () => {
		const workflow = loadWorkflow("security.yml");
		expect(typeof workflow).toBe("object");
		expect(workflow.name).toBe("Security");
	});

	it("triggers on workflow_call only", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.on).toHaveProperty("workflow_call");
		expect(Object.keys(workflow.on)).toEqual(["workflow_call"]);
	});

	it("defines opt-in boolean inputs for each security tool", () => {
		const workflow = loadWorkflow("security.yml");
		const inputs = workflow.on.workflow_call.inputs;

		expect(inputs["enable-dependency-review"].type).toBe("boolean");
		expect(inputs["enable-dependency-review"].default).toBe(true);

		expect(inputs["enable-semgrep"].type).toBe("boolean");
		expect(inputs["enable-semgrep"].default).toBe(true);

		expect(inputs["enable-gitleaks"].type).toBe("boolean");
		expect(inputs["enable-gitleaks"].default).toBe(true);
	});

	it("has top-level read-only permissions", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.permissions).toEqual({ contents: "read" });
	});

	it("defines expected security jobs", () => {
		const workflow = loadWorkflow("security.yml");
		const jobNames = Object.keys(workflow.jobs);
		expect(jobNames).toContain("dependency-review");
		expect(jobNames).toContain("semgrep");
		expect(jobNames).toContain("gitleaks");
		expect(jobNames).toContain("gitleaks-config-conformance");
		expect(jobNames).toContain("workflow-tag-conformance");
	});

	it("dependency-review job is gated by enable-dependency-review input", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.jobs["dependency-review"].if).toContain(
			"inputs.enable-dependency-review",
		);
	});

	it("semgrep job is gated by enable-semgrep input", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.jobs.semgrep.if).toContain("inputs.enable-semgrep");
	});

	it("gitleaks job is gated by enable-gitleaks input", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.jobs.gitleaks.if).toContain("inputs.enable-gitleaks");
	});

	it("workflow-tag-conformance job always runs (no conditional)", () => {
		const workflow = loadWorkflow("security.yml");
		expect(workflow.jobs["workflow-tag-conformance"].if).toBeUndefined();
	});

	it("gitleaks checkout uses fetch-depth: 0 for full history scan", () => {
		const workflow = loadWorkflow("security.yml");
		const steps = workflow.jobs.gitleaks.steps;
		const checkoutStep = steps.find((s: { uses?: string }) =>
			s.uses?.includes("actions/checkout@"),
		);
		expect(checkoutStep.with["fetch-depth"]).toBe(0);
	});

	it("all third-party actions use SHA pinning (except container images)", () => {
		const workflow = loadWorkflow("security.yml");
		for (const [, job] of Object.entries<Record<string, unknown>>(
			workflow.jobs,
		)) {
			for (const step of (job as { steps?: Array<{ uses?: string }> }).steps ??
				[]) {
				if (step.uses) {
					expect(step.uses).toMatch(/@[0-9a-f]{40}/);
				}
			}
		}
	});
});
