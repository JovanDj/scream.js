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

## Local Agents

* Before CQRS implementation or its DI/testing review, read [CQRS Architecture Context](docs/agent-instructions/cqrs-architecture-context.md). It records why the convention exists, how user corrections shaped it, the goals to preserve, and which earlier suggestions were rejected or deferred.
* Use `screamjs_cqrs_engineer` to implement explicitly assigned migrations to specialized HTTP actions plus command/query handlers, manual DI, `CommandHandlerFactory.create(tx)`, and `TransactionHandler`. Loading the agent does not authorize a migration or a whole-repository rewrite.
* For an approved CQRS migration, the convention in that agent's instructions supersedes older fat-controller/action-owned SQL and transaction guidance within the assigned scope. Update conflicting architecture documentation as that scope is migrated; do not change unrelated conventions. `TransactionHandler` is an ordinary wrapper object, not decorator syntax or decorator-based injection.
* Use `seemann_di_reviewer` for dependency composition, lifetime, and DI reviews.
* Use `khorikov_testing_reviewer` for public-behavior testability and test-quality reviews.
* For architecture reviews or changes to dependency boundaries/shared action workflows, ask both agents to review the affected scope before completion. Do not request whole-repository audits for routine changes.
* Agent definitions live in `.codex/agents/`. The two reviewers are read-only; `screamjs_cqrs_engineer` may edit only its explicitly assigned implementation scope. The parent coordinates independent reviews and reports unavailable reviewers as pending. Evaluate findings against project conventions and reproduce suspected defects before changing production code.

## Detailed Instructions

* [Product Direction](docs/agent-instructions/product-direction.md)
* [Architecture Guidelines](docs/agent-instructions/architecture.md)
* [HTTP and Routing Guidelines](docs/agent-instructions/http-and-routing.md)
* [Validation and Error Guidelines](docs/agent-instructions/validation-and-errors.md)
* [Template Engine Guidelines](docs/agent-instructions/template-engine.md)
* [Testing Guidelines](docs/agent-instructions/testing.md)
* [Code Style Guidelines](docs/agent-instructions/code-style.md)
