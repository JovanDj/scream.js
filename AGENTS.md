# ScreamJS Working Rules

These rules are mandatory for new code and refactors. They describe the current direction for Scream.js.

## Product Decisions

Scream.js is a full-stack TypeScript framework for SSR HTML applications, not merely a backend framework.

Scream.js is:

* SSR HTML-only
* database-backed
* CRUD-first
* explicit
* testable
* boring in the right way

The framework rejects:

* Express-style chaos
* NestJS-style ceremony
* Next.js frontend gravity
* Laravel/Rails-style dynamic magic
* decorators, reflection, metadata, runtime scanning, and hidden object assembly

The core principle is speed of delivery inside architectural guardrails.

Framework defaults:

* fat controllers are acceptable
* services are optional
* repositories are optional
* gateways are optional
* ORMs are not required or provided by default
* query files are not created by default
* dependency containers are not used
* hidden magic is not allowed

Refactor only when real pressure appears:

| Pressure | Refactor toward |
| --- | --- |
| Controller becomes hard to read | service/use case |
| SQL repetition appears | persistence abstraction |
| Business rules grow | domain/table object |
| Repeated rendering behavior appears | base/helper |
| Validation gets large | module-local validator/schema |

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

## Resource Routing

Default routing should be resource-based for SSR CRUD.

Canonical actions:

* `index`
* `create`
* `store`
* `show`
* `edit`
* `update`
* `destroy`

Use Laravel-style `create`/`store`, not Rails-style `new`/`create`. Use `destroy`, not `delete`.

Resource routing should use separate action interfaces, so users can pick actions individually. Full CRUD is a prebuilt composition of those action interfaces.

Default resource routes:

| HTTP | Path | Action |
| --- | --- | --- |
| GET | `/todos` | `index` |
| GET | `/todos/create` | `create` |
| POST | `/todos` | `store` |
| GET | `/todos/:id` | `show` |
| GET | `/todos/:id/edit` | `edit` |
| PATCH | `/todos/:id` | `update` |
| DELETE | `/todos/:id` | `destroy` |

Controllers use classic methods, not arrow-function fields. The router/resource system must support classic methods without making users fight JavaScript binding.

## Route Names and URL Generation

`resource()` generates route names automatically. Do not add explicit route-name overrides.

`routes.resource("/todos", todosController)` generates:

* `todos.index`
* `todos.create`
* `todos.store`
* `todos.show`
* `todos.edit`
* `todos.update`
* `todos.destroy`

Nested paths become dot-separated route namespaces. For example, `/admin/blog-posts` generates names such as `admin.blog-posts.index`.

Dynamic params are skipped in route names. For example, `/projects/:projectId/tasks` generates names such as `projects.tasks.index`.

`route()` rules:

* returns relative URLs only
* fills path params first
* leftover values become query params
* URL-encodes path and query values
* template engine handles HTML escaping
* fails loudly on missing route names or missing params
* omits `undefined`
* preserves empty strings
* rejects `null`
* rejects objects
* rejects `Date`
* supports arrays as repeated query keys
* serializes booleans as `true` and `false`

## Path Handling

* Registered routes normalize away trailing slash, except `/`.
* Route generation outputs canonical non-trailing-slash URLs.
* Request matching tolerates trailing slashes silently.
* No automatic redirect.
* Route matching is case-sensitive.
* Path params are decoded before controller access.
* Invalid percent encoding returns `400 Bad Request`.
* Params remain strings until explicit validation or coercion.

## HTML Forms

Scream.js is SSR form-first.

Method spoofing:

* enabled by default
* handled before route matching
* only reads POST body `_method`
* supports `PATCH` and `DELETE`
* is not handled in controllers

CSRF:

* part of the framework
* handled in the HTTP/app middleware pipeline
* applies to unsafe methods
* ignored for `GET`
* invalid token returns `403`
* token is automatically exposed to templates as `csrfToken`

Do not add a form-helper DSL. Plain HTML comes first.

## Request Validation and Form Errors

Request values stay raw until validation.

Rules:

* route params are decoded strings
* query params are decoded strings or string arrays
* form body values are decoded but not magically typed
* JSON bodies still require validation

`HttpContext` should provide boundary validation helpers:

* `context.param(...)`
* `context.query(...)`
* `context.body(...)`

Actual schemas and validators remain explicit and reusable.

Validation returns a discriminated union, not exceptions:

```ts
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: FormErrors };
```

Invalid user input is normal control flow, not exceptional framework failure.

Validation errors, business-rule errors, and database conflicts render through one form-error contract.

`FormErrors` is a small first-class object. It supports:

* field errors
* form/global errors
* `field("email")`
* `has("email")`
* `any()`

Errors are keyed by stable field paths:

```ts
{
  fields: {
    "user.email": ["Email must be valid"],
    "items.0.name": ["Name is required"],
  },
  form: ["Invalid submission"],
}
```

Cross-field validation is required through simple object-level refinement. Async/database-backed validation is not part of the schema system. Do those checks after parsing, with DB constraints as the final guard.

## Template Engine

The template engine is a first-class core framework component, behind a small rendering contract.

The template pipeline is:

```text
template source/name
-> resolver
-> tokenizer
-> parser
-> transformer
-> generator
-> HTML
```

Stage responsibilities:

| Stage | Responsibility |
| --- | --- |
| Resolver | Load and statically compose templates |
| Tokenizer | Turn source into tokens |
| Parser | Turn tokens into AST |
| Transformer | Transform AST only |
| Generator | Render AST with context |

Every stage receives structured input, returns structured output, and does not do another stage's job.

Layout resolution and includes belong in the resolver, not the transformer, tokenizer, parser, or generator. The resolver returns a merged template source string, not a template graph.

Template loading and inheritance rules:

* `{% extends %}` is static only
* `{% extends %}` must be the first meaningful statement
* a template may have zero or one direct parent
* no conditional or dynamic extends
* child templates that extend layouts may contain only extends plus block definitions at top level
* parent block fallback content renders when not overridden
* unknown child block overrides fail loudly
* missing templates fail loudly
* include/layout cycles fail loudly and report the cycle path
* includes use static string literals only
* includes resolve recursively
* no dynamic includes
* includes resolve from the configured views root
* no `./` or `../` relative paths
* absolute paths and traversal outside views root are rejected
* explicit file extensions are required
* `.scream` is the only template extension
* plain HTML is valid `.scream`

Template expression rules:

* variable output is HTML-escaped by default
* no raw or unescaped output
* no arbitrary JavaScript
* no complex inline computation
* no `Math`, `process`, globals, imports, or arbitrary object method calls
* helper calls are limited to explicitly provided view helpers
* top-level helpers are allowed
* `route(...)` is a top-level helper
* `csrfToken` is a value, not a helper function
* comments use `{# comment #}`
* comments are removed from output
* comments are allowed anywhere whitespace is allowed
* comments are not allowed inside expressions
* whitespace trimming syntax is excluded

Allowed expression examples:

```scream
{{ user.name }}
{{ todo.title }}
{{ route("todos.show", { id: todo.id }) }}
{{ errors.field("title") }}
```

## Current Implementation Priorities

1. Keep the scope focused on SSR HTML CRUD.
2. Design resource routing: action interfaces, `resource()` registration, and generated route names.
3. Build route generation: `route(name, params)` with the rules above.
4. Add method spoofing: POST plus `_method`.
5. Add CSRF middleware and expose `csrfToken` automatically to views.
6. Define `FormErrors` as one renderable error contract.
7. Define the validation result shape as a discriminated union.
8. Refactor the template engine pipeline so layout/include resolution lives in a resolver stage.
9. Restrict template syntax to static composition, escaped output, and simple expressions.
10. Prove everything with one boring CRUD app.

## Goal

Build the simplest system that works well as soon as possible.

Prefer:

* direct code over layered indirection
* fewer files over textbook separation
* real behavior over architectural purity
* local clarity over abstract reuse

Avoid introducing structure unless it clearly pays for itself now.

## Prototype-First Approach

### Context

Most greenfield projects do not fail because the first version lacked enough abstraction. They fail because they took too long to deliver, solved the wrong problem, or buried simple behavior under speculative architecture.

In early project stages, the business usually values:

* speed of delivery
* feedback from real usage
* low cost of change
* proof that the product is worth expanding

This means the architecture should start from the simplest shape that can be shipped safely and tested honestly.

Prototype-first does not mean careless code. It means starting with the minimum structure that works, while keeping the code easy to reshape later.

### Reasoning

A complex architecture only pays for itself when the complexity it manages is already real.

Before that point, heavy abstractions usually:

* slow down delivery
* increase indirection
* hide simple behavior
* make the code harder to learn
* create fake flexibility for futures that may never happen

For early-stage software, the best tradeoff is usually:

* direct implementation
* real end-to-end tests
* explicit transactions
* no speculative layers

This follows Gall's Law:

> A complex system that works is invariably found to have evolved from a simple system that worked.

Do not start with the architecture you hope to need later. Start with the architecture the current problem actually needs.

### Default shape

The default greenfield approach is:

* fat controller
* direct SQL
* black-box tests at the HTTP boundary

The controller may temporarily contain:

* request parsing
* authorization checks
* validation flow
* transaction boundaries
* SQL queries
* response shaping

That is acceptable if the behavior is correct, explicit, and well-tested from the outside.

Refactor only when real pressure appears.

### Core rules

#### Start simple

For new greenfield features, prefer the simplest implementation that can be shipped safely.

Default to:

* fat controller
* direct SQL
* HTTP-boundary black-box tests

Do not introduce service layers, repositories, mappers, or domain models before they are justified by real complexity.

#### Keep module seams explicit

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

#### Keep boundaries honest

Even in prototype mode, keep responsibilities conceptually clear:

* Controller = handles HTTP input and output
* Model = non-UI logic and data access, even if still simple
* View = rendering and presentation only

MVC still applies.

A rich domain model is not required for MVC. In prototype mode, the model may simply be:

* transaction script logic
* direct SQL
* simple query helpers

Views must not contain business logic. Model code must not depend on HTTP or templates.

#### Controllers and DB access

* Controllers may take `db` directly.
* Controllers may perform queries, writes, and transactions directly when that is the simplest option.
* Controllers may contain business logic if extracting it would only create ceremony.
* In prototype mode, business logic kept in a controller must remain independent of HTTP concerns.
* Controller-owned business logic must stay extractable without being rewritten.
* Do not mix HTTP branching with business rules.
* When controller-owned business logic becomes reusable or complex, it must move out of the controller.
* Even in prototype mode, keep controller methods structured:
  1. Parse and validate input.
  2. Execute use-case logic.
  3. Persist changes with SQL.
  4. Produce the response.
* Do not interleave these steps arbitrarily.
* Keep the flow linear and readable.
* Keep controller methods readable. If a method gets too long, extract a local private helper before introducing a new layer.
* `HttpContext` must not expose database access.

Prefer explicit local helpers over creating new service or mapper classes.

#### Be explicit about transactions

* No ambient DB globals inside modules. Pass `db` explicitly.
* If a transaction is needed, start it in the place that currently owns the behavior, including a controller.
* Inside a transaction, consistently use `tx`.
* Keep the whole use case atomic.
* Commit only when all required writes succeed.
* Run side effects after commit when rollback would make them invalid.
* Do not hide transaction boundaries inside low-level helpers.
* External I/O should still stay out of DB transactions unless there is a strong reason not to.

#### Side effects rule

External side effects such as events, emails, and HTTP calls:

* must not run inside DB transactions unless strictly necessary
* must run only after successful commit

Violation of this rule risks inconsistent system state.

#### Concurrency expectations

For write flows:

* use transactions for multi-step writes
* use `SELECT ... FOR UPDATE` when correctness depends on current state

Do not assume single-user execution.

#### Parse at boundaries

* Treat all external input as raw and untrusted.
* Raw boundary data must be parsed into trusted values before use.
* Applying a validator must return either a trusted parsed value or structured errors.
* Do not use boolean validation checks that leave raw data in circulation.
* Never let inner layers inspect or depend on raw boundary data.
* Boundary adapters own where data comes from.
* Feature modules own what valid data looks like for their use cases.
* Shared code may provide generic validator primitives and combinators only.
* Shared code must not own feature-specific contracts.
* Whoever owns the persistence boundary must validate and parse raw rows before returning trusted module data.
* When a repository layer exists, it owns row parsing. When a controller, service, query object, or another module-local abstraction owns persistence directly, that layer owns row parsing instead.
* Do not return raw database rows from the persistence boundary.

#### Use direct SQL freely, but carefully

Direct SQL is acceptable in prototype mode.

SQL should be:

* explicit
* readable
* local to the use case
* safe under concurrency when needed

Do not extract SQL only to make the project look more architectural.

Extract it only when:

* duplication appears
* queries get hard to reason about
* multiple use cases depend on the same query behavior

#### Keep types practical

* Keep only the types that help current code stay clear and safe.
* Schema files are useful for request validation and boundary parsing, but they are optional if inline validation is clearer.
* Domain models are optional. Keep them only if they contain real behavior worth isolating.
* Read models and write models may be separate or combined. Choose the simpler shape for the current use case.

#### Refactor only under real pressure

Do not refactor just because the code is "not clean enough" in theory.

Do not wait until:

* changes are risky
* bugs appear due to complexity
* developers avoid touching code

Refactor when:

* understanding the code takes longer than writing new code

Consider refactoring when one or more of these are true:

* the same rule appears in multiple places
* the same SQL appears in multiple places
* one controller action becomes hard to reason about
* one use case must be reused outside HTTP
* transaction handling becomes repetitive
* behavior changes are becoming risky
* branching workflows become too hard to follow

Until then, prefer delivery over structure.

There are no arbitrary service-extraction thresholds.

Services are not a default module pattern. They are one possible first step when refactoring a controller-led module after real pressure appears.

Extract a service only when it makes the next change easier now. A service may be a good fit when it gives a reusable use case a clear home, keeps HTTP concerns out of business logic, or makes a transaction script easier to reason about. If the service only forwards calls, hides simple SQL, or exists because a controller crossed a numeric threshold, inline it.

#### No premature abstraction

Do not add:

* base classes
* generic repositories
* generic mappers
* indirection-only interfaces
* "future-proof" layers

Add a new abstraction only when the current code is harder to change because the abstraction is missing.

Deletion is preferred over preserving unused abstractions.

If a layer is no longer useful:

* remove it
* inline it
* simplify it

Do not keep structure "just in case".

#### Name things honestly

Do not use advanced pattern names unless they actually fit.

If a class:

* contains SQL and returns rows, call it a gateway or query object
* coordinates one use case, call it a service or use case handler
* handles HTTP, call it a controller
* renders output, call it a view or template

Do not call a DB-shaped class a repository unless it actually behaves like a repository.
Do not call a procedural service a domain model.

### Decision heuristic

Before introducing a new abstraction, ask:

1. What exact duplication or complexity does this remove?
2. Is that problem already real?
3. Will this make the next change easier right now?
4. Would a simpler extraction solve the same problem?

If the answer is vague, do not add the abstraction yet.

### Final principle

Prefer:

* a simple working system
* with strong HTTP-boundary tests
* and explicit transaction handling

over:

* a speculative architecture
* with abstractions that have not yet earned their place

Prototype mode is the default starting point for greenfield work. Extensibility is introduced later, in response to real complexity.

## Testing

* Use `node --test`.
* Test observable behavior.
* Prefer a small number of integration-style tests over many brittle unit tests.
* Keep tests colocated with the module they cover.
* DB-backed tests must still isolate their state and clean up after themselves.
* If a layer no longer exists, its tests should be removed or folded into higher-level tests.
* Do not write unit tests for controller internals, temporary helper functions, or code that is likely to be refactored soon.
* Test behavior, not structure.

Good default test targets:

* HTTP behavior for controller-driven modules
* DB-visible outcomes for persistence-heavy flows
* small pure tests only where logic is genuinely easier to verify in isolation

## Practical code quality

* Keep functions short enough to scan quickly.
* Prefer straightforward names and explicit data flow.
* Avoid `as` casts unless there is no cleaner practical option.
* Do not use compile-time casts to work around missing boundary types. Parse or narrow data into a concrete type instead.
* Keep comments rare and useful.
* Refactor only when it makes the next change easier or the current code clearer.

The best design here is the one that keeps shipping speed high without making the next few changes painful.
