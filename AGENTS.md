# ScreamJS Agent Instructions

Scream.js is a full-stack TypeScript framework for SSR HTML CRUD applications with explicit boundaries, manual dependency composition, and no hidden magic.

This file is intentionally minimal. Read the linked instruction file for any area you touch.

## Quick Reference

* **Package manager:** npm
* **Integration tests:** `npm run test:integration`
* **Typecheck:** `npm run typecheck`
* **Lint:** `npm run lint`
* **Full project check:** `npm run check` (runs Biome with fixes)

## Universal Rules

* Keep the scope focused on SSR HTML, database-backed CRUD.
* Prefer direct code, explicit data flow, and boring behavior over speculative abstractions.
* Evolve narrow abstractions from proven concrete workflows; keep concrete application code easier to understand than the abstraction supporting it.
* Do not add decorators, reflection, metadata scanning, dependency containers, service locators, or hidden object assembly.
* Use manual dependency composition; dependencies must be visible in constructors.
* Treat external input as raw until parsed into trusted values.
* Make public behavior testable with supplied dependencies; prefer observable black-box behavior over brittle structure and interaction tests.
* Preserve existing user changes in the worktree. Do not revert unrelated edits.

## Local Review Agents

* Use `seemann_di_reviewer` for dependency composition, lifetime, and DI reviews.
* Use `khorikov_testing_reviewer` for public-behavior testability and test-quality reviews.
* For architecture reviews or changes to dependency boundaries/shared action workflows, ask both agents to review the affected scope before completion. Do not request whole-repository audits for routine changes.
* Agents live in `.codex/agents/` and are read-only. Evaluate findings against project conventions and reproduce suspected defects before changing production code.

## Detailed Instructions

* [Product Direction](docs/agent-instructions/product-direction.md)
* [Architecture Guidelines](docs/agent-instructions/architecture.md)
* [HTTP and Routing Guidelines](docs/agent-instructions/http-and-routing.md)
* [Validation and Error Guidelines](docs/agent-instructions/validation-and-errors.md)
* [Template Engine Guidelines](docs/agent-instructions/template-engine.md)
* [Testing Guidelines](docs/agent-instructions/testing.md)
* [Code Style Guidelines](docs/agent-instructions/code-style.md)
