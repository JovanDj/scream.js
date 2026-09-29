# Architecture Guidelines

## Overview

Prototype mode is the default starting point for greenfield work. Start with the minimum structure that works, while keeping the code easy to reshape later. Follow Gall's law: evolve complexity from a simpler working system instead of designing the final architecture upfront.

## Manual Dependency Composition

Manual dependency injection is permanent.

Rules:

* app composition wires dependencies
* dependencies are visible in constructors
* no IoC container
* no service locator
* no decorator injection
* no metadata scanning

The composition root may assemble the app. The framework must not secretly assemble business objects.

## Start Simple

For new greenfield features, prefer the simplest implementation that can be shipped safely.

Start with readable concrete code. Observe actual repetition and change pressure before extracting an abstraction. Trial an extraction against the concrete callers and revert it when it makes them harder to understand.

Default to:

* a readable concrete controller
* direct SQL
* HTTP-boundary black-box tests

Do not introduce repositories, mappers, or domain models before they are justified by real complexity. In the current application, database-backed controllers delegate to Services so operations are callable and testable without HTTP; render-only controllers need no Service.

## Module Seams

* Keep code under `src/modules/<module>/`.
* No subfolders inside a module.
* File names are descriptive, not mandatory architecture boundaries.
* `index.ts` should expose the smallest useful module API.
* `export *` is discouraged; prefer explicit exports.
* Every module must expose an explicit public API through `index.ts`.
* Cross-module imports must go only through that public API.
* Modules must mount themselves through `mount(app)`.
* Do not import internal files from another module.
* If a file is not meant to be used outside the module, do not export it from `index.ts`.

Allowed examples:

* controller-only module
* controller + schema
* controller + small helper file
* service/mapper split, but only if it is currently useful

There is no requirement to keep controller, service, mapper, repository, and domain files if they do not earn their cost.

## MVC Boundaries

Even in prototype mode, keep responsibilities conceptually clear:

* Controller = handles HTTP input and output
* Service = a caller-independent application operation when one is needed
* Model = non-UI logic and data access, even if still simple
* View = rendering and presentation only

A rich domain model is not required for MVC. In prototype mode, the model may simply be transaction script logic, direct SQL, or simple query helpers.

Views must not contain business logic. Model code must not depend on HTTP or templates.

## Controllers and Services

CRUD controllers provide familiar HTTP workflows, but applications may define custom controllers for other operations. Render-only routes need no separate Service.

A service represents a use case, not a broad collection of unrelated methods. Its public operation accepts ordinary validated input and explicitly supplied dependencies, without `HttpContext`, routes, templates, or redirects. A job, queue consumer, CLI, or JSON API may call the same service without constructing an HTTP controller. Keep construction visible through manual DI.

When an operation requires identity, each entry point establishes its caller. Authorization for a shared operation belongs at the service boundary so a non-HTTP caller cannot bypass it; pass the needed caller identity explicitly. Public routes need no artificial authentication. Add policy machinery only when an actual rule requires it.

Services must be directly testable through their public operations without invoking any controller. For database-backed services, assert results and persisted state against an isolated database rather than mocking internal SQL calls.

## Controllers and DB Access

* Current application controllers parse and validate HTTP input, call an injected Service for database work, then render or redirect.
* Services own database reads, writes, transactions, and raw-row validation. They do not receive `HttpContext`.
* Keep controller methods linear and readable; retain HTTP error behavior and presentation in the controller.
* Render-only controllers do not need a Service.
* `HttpContext` must not expose database access.

## Controller Workflow Abstractions

Do not add general-purpose controller base classes.

A narrow controller-specific base class is allowed only when the same lifecycle already exists across multiple CRUD controllers. For example, repeated index controllers may share one IndexController abstraction without forcing show, store, update, or non-CRUD controllers into the same workflow.

HTTP-facing classes and the shared interface use the `Controller` suffix.

Rules:

* the base class owns lifecycle ordering and stable shared mechanics only
* concrete controllers retain HTTP validation, presentation, URLs, and templates; Services own database operations and persistence parsing
* protected members exist only as deliberate extension points required by the lifecycle
* unrelated and unique controllers remain concrete until repetition is demonstrated
* non-CRUD controllers do not inherit CRUD workflows merely for consistency
* each controller must remain understandable as one HTTP workflow

Judge the abstraction by its concrete subclasses. If they become harder to read or require indirection to explain their data, simplify or remove the abstraction.

## Transactions and Side Effects

* No ambient DB globals inside modules. Pass `db` explicitly.
* If a transaction is needed, start it in the Service or its explicitly composed transaction wrapper.
* Inside a transaction, consistently use `tx`.
* Keep the whole use case atomic.
* Commit only when all required writes succeed.
* Run side effects after commit when rollback would make them invalid.
* Do not hide transaction boundaries inside low-level helpers.
* External I/O should stay out of DB transactions unless there is a strong reason not to.

External side effects such as events, emails, and HTTP calls must not run inside DB transactions unless strictly necessary. They must run only after successful commit.

For write flows:

* use transactions for multi-step writes
* use `SELECT ... FOR UPDATE` when correctness depends on current state
* do not assume single-user execution

## Persistence and SQL

Direct SQL is acceptable in prototype mode.

SQL should be:

* explicit
* readable
* local to the use case
* safe under concurrency when needed

Do not extract SQL only to make the project look more architectural.

Extract SQL only when duplication appears, queries get hard to reason about, or multiple use cases depend on the same query behavior.

Whoever owns the persistence boundary must validate and parse raw rows before returning trusted module data. When a repository layer exists, it owns row parsing. When a controller, service, query object, or another module-local abstraction owns persistence directly, that layer owns row parsing instead.

Do not return raw database rows from the persistence boundary.

## Types and Abstractions

* Keep only the types that help current code stay clear and safe.
* Schema files are useful for request validation and boundary parsing, but they are optional if inline validation is clearer.
* Domain models are optional. Keep them only if they contain real behavior worth isolating.
* Read models and write models may be separate or combined. Choose the simpler shape for the current use case.

Do not add:

* general-purpose controller base classes
* generic repositories
* generic mappers
* indirection-only interfaces
* future-proof layers

Add a new abstraction only when the current code is harder to change because the abstraction is missing.

If a layer is no longer useful, remove it, inline it, or simplify it.

## Refactoring Heuristic

Do not refactor just because the code is "not clean enough" in theory.

Refactor when understanding the code takes longer than writing new code.

Consider refactoring when:

* the same rule appears in multiple places
* the same SQL appears in multiple places
* one controller action becomes hard to reason about
* one use case must be reused outside HTTP
* transaction handling becomes repetitive
* behavior changes are becoming risky
* branching workflows become too hard to follow

Services are not mandatory for render-only controllers. In the current application, even simple database operations have a Service so they are directly callable and testable without HTTP. Do not add further forwarding layers beneath them without a concrete need.

## Naming

Do not use advanced pattern names unless they actually fit.

* If a class contains SQL and returns rows, call it a gateway or query object.
* If a class coordinates one use case, call it a service or use case handler.
* If a class handles HTTP, call it a controller.
* If a class renders output, call it a view or template.

Do not call a DB-shaped class a repository unless it actually behaves like a repository. Do not call a procedural service a domain model.

Before introducing a new abstraction, ask:

1. What exact duplication or complexity does this remove?
2. Is that problem already real?
3. Will this make the next change easier right now?
4. Would a simpler extraction solve the same problem?

If the answer is vague, do not add the abstraction yet.

## External Libraries

Before implementing generic infrastructure from scratch, check whether a popular maintained package already provides it. Prefer a small package with an MIT or compatible permissive license when it fits the existing boundaries without importing a larger framework model.
