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
* Do not add decorators, reflection, metadata scanning, dependency containers, service locators, or hidden object assembly.
* Use manual dependency composition; dependencies must be visible in constructors.
* Treat external input as raw until parsed into trusted values.
* Keep templates presentation-only: escaped path references, presence checks, shallow interfaces, static scoped includes, and template application over pushed ViewModels. Applied templates read only `attr` plus explicit parameters; includes read only explicit parameters. Quote dynamic attribute values, keep variables out of attribute-list and script/style positions, and preserve HTML context across all composition boundaries. Do not add loops, conditional-attribute directives, inline computation, or hard-coded/composed URL attributes.
* Push inert own data properties only; accessors and proxies are rejected. Templates own labels, HTML, CSS classes, and attribute layout. Controllers own complete URLs and map model results into ViewModels.
* Database-backed modules keep SQL in plural table gateway classes. Controllers are Transaction Scripts: they own write transactions, coordinate tables created with the same `tx`, and map results into ViewModels.
* Prefer black-box behavior tests over brittle structure tests.
* Preserve existing user changes in the worktree. Do not revert unrelated edits.

## Detailed Instructions

* [Product Direction](docs/agent-instructions/product-direction.md)
* [Architecture Guidelines](docs/agent-instructions/architecture.md)
* [HTTP and Routing Guidelines](docs/agent-instructions/http-and-routing.md)
* [Validation and Error Guidelines](docs/agent-instructions/validation-and-errors.md)
* [Template Engine Guidelines](docs/agent-instructions/template-engine.md)
* [Testing Guidelines](docs/agent-instructions/testing.md)
* [Code Style Guidelines](docs/agent-instructions/code-style.md)
