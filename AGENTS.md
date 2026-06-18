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
* Prefer existing shared contracts for dependency types whenever they cover the required behavior. Do not duplicate them with per-action interfaces or inline structural types.
* Treat external input as raw until parsed into trusted values.
* Before investigating, reviewing, or changing the template engine, view templates, rendering integrations, or related tests, read [Template Engine Guidelines](docs/agent-instructions/template-engine.md). Require delegated agents working in these areas to read them first too.
* All tests must be black-box BDD: exercise public boundaries and assert observable behavior, not implementation details. See [Testing Guidelines](docs/agent-instructions/testing.md).
* All tests must be deterministic with immutable inputs and setup. Use fixed values and `const`; never reassign flags or use invocation counters to change test-double behavior. Use separate immutable scenarios or dependencies instead.
* Register test resource cleanup with `t.after()` immediately after setup; do not wrap test bodies in cleanup-only `try/finally`. Keep explicit close/shutdown calls only when their behavior is under test.
* HTTP entry points are Controllers; caller-independent application operations are Services.
* CRUD controllers are conveniences, not constraints. Custom controllers and services for non-HTTP callers are first-class.
* Keep templates presentation-only: escaped attribute references, presence checks, static includes, and template application. Do not add view-side loops, conditional-attribute directives, inline computation, or hard-coded/composed URL attributes.
* Preserve existing user changes in the worktree. Do not revert unrelated edits.

## Local Agents

* For every user question or request, consult an appropriate agent in addition to your own analysis. Use a relevant specialist when available, otherwise a general-purpose agent. Wait for and evaluate its answer before responding; do not routinely invoke all agents.
* Delegation must stay within the user's scope and the agent's permissions. It does not authorize edits or broader work. If delegation is unavailable, say so instead of implying an agent reviewed the answer.
* Use `seemann_di_reviewer` for dependency composition, lifetime, and DI reviews.
* Use `khorikov_testing_reviewer` for public-behavior testability and test-quality reviews.
* Use `fowler_enterprise_patterns_reviewer` when deciding whether an existing enterprise pattern fits or a different pattern is justified by current code.
* Use `screamjs_cqrs_engineer` only for an explicitly approved task after reading [CQRS Architecture Context](docs/agent-instructions/cqrs-architecture-context.md). Its current Controller/Service convention supersedes older Action/Handler examples in the agent brief; installing the agent does not authorize an application migration.
* For architecture reviews or changes to dependency boundaries/shared controller workflows, ask both agents to review the affected scope before completion. Do not request whole-repository audits for routine changes.
* Agents live in `.codex/agents/`. Reviewers are read-only; the CQRS engineer may edit only its delegated scope. Evaluate findings against project conventions and reproduce suspected defects before changing production code.

## Detailed Instructions

* [Product Direction](docs/agent-instructions/product-direction.md)
* [Architecture Guidelines](docs/agent-instructions/architecture.md)
* [HTTP and Routing Guidelines](docs/agent-instructions/http-and-routing.md)
* [Validation and Error Guidelines](docs/agent-instructions/validation-and-errors.md)
* [Template Engine Guidelines](docs/agent-instructions/template-engine.md)
* [Testing Guidelines](docs/agent-instructions/testing.md)
* [Code Style Guidelines](docs/agent-instructions/code-style.md)
