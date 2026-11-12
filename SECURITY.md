# Security Policy

## Scope

This policy applies to everything this repository distributes to other repositories:

- the shared configuration packages under `packages/` (`@nullvariant/onsa-*`)
- the reusable GitHub Actions workflows under `.github/workflows/` (`ci.yml` and `security.yml`)
- the configuration templates and expected values under `configs/`

Because other repositories consume these files, a weakness here can weaken the checks of every repository that uses them. Examples are a configuration that silently disables a check, or a workflow that can be made to run untrusted input.

## Supported Versions

onsa has no tagged releases yet. Fixes are made on `main`, and only the latest commit on `main` is supported. Consumers pin the reusable workflows by commit SHA.

## Reporting a Vulnerability

Please report a suspected vulnerability by email to `security@nullvariant.com`.

**Please do NOT open a public issue for a security vulnerability.**

Include what you found, where it is (file and line, or the workflow and job), and how to reproduce it. If the report contains a secret or token, revoke it first and describe it without pasting the value.
