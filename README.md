# ScreamJS

**A full-stack TypeScript framework for SSR HTML applications with strict DI, explicit boundaries, and zero magic.**

> Warning: **Status & Intended Use**
>
> ScreamJS is **not production-ready**. It is **actively developed** and intended **only for testing and educational purposes** at this stage. Public APIs and behavior may change without notice.

ScreamJS is a handcrafted, opinionated, batteries-included framework focused on **SSR HTML CRUD applications**. It favors a modular monolith shape with explicit module seams, constructor injection, no global singletons, and boring database-backed workflows that are easy to test. Modules may start with controller-led implementations and grow into more layered designs only when that improves clarity.

The scope is intentionally narrow: **SSR HTML-only, database-backed, CRUD-first, explicit, testable, and boring in the right way**.

ScreamJS rejects Express-style chaos, NestJS-style ceremony, Next.js frontend gravity, Laravel/Rails-style dynamic magic, decorators, reflection, metadata, runtime scanning, dependency containers, and hidden business-object assembly.

---

## Why ScreamJS?

* **SSR HTML first** - templates, forms, CSRF, method spoofing, validation errors, and route generation are core concerns.
* **Strict DI** - dependencies are explicit and compile-time type-checked.
* **OOP where useful** - small objects, explicit collaborators, and no inheritance pyramids.
* **HTTP adapter boundary** - the framework can sit on an HTTP adapter without making user code feel like Express-style route soup.
* **Typed persistence** - explicit persistence boundaries; DB choice is yours.
* **Opinionated defaults** - conventions over configuration; clear stances keep projects consistent.
* **First-party batteries** - include as many batteries as practical and hand-craft them when possible.
* **Zero surprises** - ESM-only, Node 22+, strict TypeScript, Biome for lint/format.

## Scope

Core principle: **speed of delivery inside architectural guardrails**.

Framework defaults:

* fat controllers are acceptable
* services are optional
* repositories are optional
* gateways are optional
* no ORM is provided or required
* no query files by default
* no dependency container
* no hidden magic

Extraction happens only when pressure appears:

| Pressure | Refactor toward |
| --- | --- |
| Controller becomes hard to read | service/use case |
| SQL repetition appears | persistence abstraction |
| Business rules grow | domain/table object |
| Repeated rendering behavior appears | base/helper |
| Validation gets large | module-local validator/schema |

## TypeScript Strictness

TypeScript is configured with maximum strictness in a single-source `tsconfig`. Settings are never changed per environment or at runtime: no ts-node loaders, env-specific extends, or ad-hoc overrides.

* Uses `erasableSyntaxOnly` so only erasable type syntax is allowed; the compiler emits plain JavaScript with no TypeScript-specific runtime semantics.

## Architecture

### Simplicity inside modules

* Strong module boundaries are mandatory. Internal layering is not.
* Start with the smallest clear implementation inside a module.
* A controller may own use-case and database logic when that is the simplest workable design.
* Introduce services, repositories, and extra files only when current complexity justifies them.
* Do not add abstractions only because they are conventional.
* Removing code is better than preserving unused abstractions. If a layer is no longer useful, remove it, inline it, or simplify it.
* Keep modules flat by default. Split files only when readability or change cost clearly improves.
* Services are not a default module pattern. Treat them as a refactoring step when current complexity makes a controller-led module harder to change.
* When a controller method grows past clear prototype scale, extract a transaction script service.

### Non-negotiable boundaries

* Build as a modular monolith.
* Every module must expose an explicit public API through `index.ts`.
* Cross-module imports must go only through that public API.
* Modules must mount themselves through `mount(app)`.
* Treat all external input as raw and untrusted.
* Raw boundary data must be parsed into trusted values before use.
* `HttpContext` must not expose database access.

### Manual dependency composition

Manual dependency injection is permanent.

* app composition wires dependencies
* dependencies are visible in constructors
* no IoC container
* no service locator
* no decorator injection
* no metadata scanning

The composition root may assemble the app. The framework must not secretly assemble business objects.

### Persistence boundaries

* Database rows are boundary data too.
* Whoever owns the persistence boundary must parse raw rows before returning trusted values.
* That persistence boundary may be a repository, controller, service, query object, or another module-local abstraction.
* When a repository layer exists, it owns row parsing. When it does not, the layer that performs persistence directly owns that parsing.

### Side effects and concurrency

External side effects such as events, emails, and HTTP calls must not run inside DB transactions unless strictly necessary, and must run only after successful commit.

For write flows:

* use transactions for multi-step writes
* use `SELECT ... FOR UPDATE` when correctness depends on current state
* do not assume single-user execution

## Resource Routing

Default routing is resource-based for SSR CRUD.

Canonical actions:

* `index`
* `create`
* `store`
* `show`
* `edit`
* `update`
* `destroy`

Use Laravel-style `create`/`store`, not Rails-style `new`/`create`. Use `destroy`, not `delete`.

Resource routing uses separate action interfaces, so users can pick actions individually. Full CRUD is a prebuilt composition of those action interfaces.

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

Controllers use classic methods, not arrow-function fields. The router/resource system supports classic methods without making users fight JavaScript binding.

## Route Names and URL Generation

`resource()` generates route names automatically. Explicit route-name overrides are not part of the framework.

```ts
routes.resource("/todos", todosController);
```

Generates:

* `todos.index`
* `todos.create`
* `todos.store`
* `todos.show`
* `todos.edit`
* `todos.update`
* `todos.destroy`

Nested paths become dot-separated route namespaces. For example, `/admin/blog-posts` generates names such as `admin.blog-posts.index`.

Dynamic params are skipped in route names. For example, `/projects/:projectId/tasks` generates names such as `projects.tasks.index`.

`route()`:

* returns relative URLs only
* fills path params first
* converts leftover values into query params
* URL-encodes path and query values
* lets the template engine handle HTML escaping
* fails loudly on missing route names or missing params
* omits `undefined`
* preserves empty strings
* rejects `null`, objects, and `Date`
* supports arrays as repeated query keys
* serializes booleans as `true` and `false`

Registered routes normalize away trailing slash, except `/`. Route generation outputs canonical non-trailing-slash URLs. Request matching tolerates trailing slashes silently without redirecting. Route matching is case-sensitive. Path params are decoded before controller access, invalid percent encoding returns `400 Bad Request`, and params remain strings until explicit validation or coercion.

## Forms, CSRF, and Validation

ScreamJS is SSR form-first.

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

No form-helper DSL is planned. Plain HTML comes first.

Request values stay raw until validation:

* route params are decoded strings
* query params are decoded strings or string arrays
* form body values are decoded but not magically typed
* JSON bodies still require validation

`HttpContext` should provide boundary validation helpers such as `context.param(...)`, `context.query(...)`, and `context.body(...)`. Actual schemas and validators remain explicit and reusable.

Validation returns a discriminated union, not exceptions:

```ts
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: FormErrors };
```

Invalid user input is normal control flow, not exceptional framework failure.

Validation errors, business-rule errors, and database conflicts render through one form-error contract. `FormErrors` is a small first-class object that supports field errors, form/global errors, `field("email")`, `has("email")`, and `any()`.

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

| Stage | Responsibility |
| --- | --- |
| Resolver | Load and statically compose templates |
| Tokenizer | Turn source into tokens |
| Parser | Turn tokens into AST |
| Transformer | Transform AST only |
| Generator | Render AST with context |

Every stage receives structured input, returns structured output, and does not do another stage's job.

Layout resolution and includes belong in the resolver, not the transformer, tokenizer, parser, or generator. The resolver returns a merged template source string, not a template graph.

Template loading and inheritance:

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

Template expressions:

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

## Controllers

Controllers accept raw HTTP input, apply module-owned validators, call the next internal boundary with trusted data, and map the result to an HTTP response.

* Each controller method receives an injected `HttpContext` from the adapter.
* `HttpContext` encapsulates request data and response operations such as render, redirect, and not-found handling.
* Controllers stay server-agnostic across adapters.
* Controllers may temporarily contain business logic when extraction would only add ceremony.
* Even in prototype mode, keep controller methods ordered as parse/validate input, execute use-case logic, persist changes, and produce the response.
* Never surface ORM rows, raw DB rows, or persistence errors directly.

## Services, Repositories, and Domain Models

Services, repositories, and domain models are supported, not mandatory.

Use a service when orchestration or reusable business rules make the controller hard to understand. Use a repository or query object when persistence complexity or duplication is already real. Use domain models only when there is behavior or invariants worth isolating.

Do not add base classes, generic repositories, generic mappers, indirection-only interfaces, or future-proof layers.

## Linting and Formatting

Uses **Biome** for linting and formatting.

## Testing

* Uses the Node.js test runner: `node --test`.
* Test public behavior as black-box behavior.
* Prefer a small number of integration-style tests over many brittle unit tests.
* Prefer real dependencies.
* Do not write unit tests for controller internals, temporary helper functions, or code likely to be refactored soon.
* Test behavior, not structure.

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
