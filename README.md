# ScreamJS

**A TypeScript‑first web framework with strict DI, SOLID design, and zero magic.**

> ⚠️ **Status & Intended Use**
>
> ScreamJS is **not production‑ready**. It is **actively developed** and intended **only for testing and educational purposes** at this stage. APIs and behavior may change without notice.

ScreamJS is a handcrafted, **opinionated, batteries‑included** framework focused on **clarity over magic**. It favors a modular monolith shape with explicit module seams, **constructor injection**, no global singletons, and adapters so you can swap HTTP servers or data layers without rewriting your app. Modules may start with controller-led implementations and grow into more layered designs only when that improves clarity.

---

## Why ScreamJS?

* **Strict DI** – dependencies are explicit and compile‑time type‑checked.
* **SOLID & composition** – no inheritance pyramids; small parts, well‑defined extension points.
* **Framework‑agnostic HTTP** – plug in Express or Koa (or your own adapter).
* **Typed persistence** – explicit persistence boundaries; DB choice is yours.
* **Opinionated defaults** – conventions over configuration; clear stances to keep projects consistent.
* **First‑party batteries** – include as many batteries as practical and hand‑craft them when possible. Third‑party dependencies are used deliberately and chosen with a **preference for MIT licenses**.
* **Zero surprises** – ESM‑only, Node 22+, strict TypeScript, **Biome** for lint/format.

## Opinionated & Batteries‑Included

ScreamJS intentionally ships with **strong opinions** and **as many first‑party batteries as practical**. The goal is to give you a productive, consistent baseline without hidden magic:

* **Handcrafted batteries**: core capabilities are built in‑house where feasible to keep behavior predictable and docs cohesive.
* **Explicit seams at the edges**: when a third‑party tool is used, keep the boundary clear so library details do not leak where they do not belong.
* **License posture**: prefer **MIT‑licensed** dependencies.
* **Conventions first**: prefer sensible defaults and well‑defined extension points instead of sprawling configuration.

---

## TypeScript Strictness

TypeScript is configured with **maximum strictness** (e.g., `"strict": true` and related checks) in a single-source `tsconfig`. Settings are **never changed per environment or at runtime**—no ts-node loaders, env-specific extends, or ad‑hoc overrides.

* Uses `erasableSyntaxOnly` so only **erasable type syntax** is allowed; the compiler emits plain JavaScript with no TS‑specific runtime semantics.

---

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

### Non-negotiable boundaries

* Build as a modular monolith.
* Every module must expose an explicit public API through `index.ts`.
* Cross-module imports must go only through that public API.
* Modules must mount themselves through `mount(app)`.
* Treat all external input as raw and untrusted.
* Raw boundary data must be parsed into trusted values before use.
* `HttpContext` must not expose database access.

### Persistence boundaries

* Database rows are boundary data too.
* Whoever owns the persistence boundary must parse raw rows before returning trusted values.
* That persistence boundary may be a repository, a controller, a service, a query object, or another module-local abstraction.
* When a repository layer exists, it owns row parsing. When it does not, the layer that performs persistence directly owns that parsing.

### Side effects rule

External side effects such as events, emails, and HTTP calls:

* must not run inside DB transactions unless strictly necessary
* must run only after successful commit

Violation of this rule risks inconsistent system state.

### Concurrency expectations

For write flows:

* use transactions for multi-step writes
* use `SELECT ... FOR UPDATE` when correctness depends on current state

Do not assume single-user execution.

## Core Concepts

### Modules

**Purpose:** Keep feature seams explicit and consistent.

* **Public API:** each module exposes a factory through `index.ts`, typically `createXModule({ db })`.
* **Mounting:** module factories return a module object with `mount(app)`. The composition root creates modules, then mounts them explicitly.
* **Ownership:** controllers, validators, repositories, route definitions, and row validators stay internal to the module by default.
* **Internal variation:** modules may start controller-led and gain services or repositories later if that improves clarity or reduces change cost.
* **Cross-module use:** import only through another module’s `index.ts`, never through its internal files.

### Controllers

**Purpose:** Accept raw HTTP input, apply module-owned validators, call the next internal boundary with trusted data, and map the result to an HTTP response.

* **HTTP context:** Each controller method receives an injected **`HttpContext`** from the adapter. It encapsulates request data (method, path params, query, headers, cookies, body) and core response operations such as render, redirect, and not-found handling. The **`HttpContext` interface is uniform across adapters** (Express, Koa, etc.), keeping controllers server‑agnostic.
* **Parsing:** `HttpContext` applies validators to body/query/params, but feature modules own the request validators they accept. Shared code should provide only generic validator primitives and combinators.
* **Responsibilities:** extract raw request data, apply module-owned validators, call the appropriate service, repository, or controller-owned use-case logic with trusted values, and translate results to **response DTOs** and **status codes**; map domain errors to HTTP codes.
* **Inputs/Outputs:** take method + request data; produce a response DTO and status. **Never surface ORM rows or persistence errors directly.**
* **Types & DTOs:** define **independent types** for HTTP **request inputs** and **response DTOs** (template or JSON). Always **map** service/domain results into these DTOs; do **not** pass domain models straight to the view/JSON.
* **Why not return service output directly?** Decouples transport from domain, allows API/view‑model changes without touching core logic, hides internal fields, enforces serialization (dates/enums), and reduces the risk of leaking sensitive data.
* **Do:** keep them thin when that improves clarity, but prefer the smallest clear module structure over introducing layers for ceremony.
* **Prototype mode:** controllers may temporarily contain business logic, but that logic should stay independent of HTTP concerns, remain extractable without being rewritten, and avoid mixing HTTP branching with business rules.
* **Internal flow:** even in prototype mode, keep controller methods structured in a readable order: 1. parse and validate input, 2. execute use-case logic, 3. persist changes with SQL, 4. produce the response. Do not interleave these steps arbitrarily.
* **Don’t:** let raw boundary data leak past the controller boundary or into inner layers.
* **Testing:** Treat controllers as **black‑box HTTP**. Use a real HTTP test client (e.g., **SuperTest**) to send requests against the running adapter and assert **status, headers, and body**.

  * **Don’t mock `HttpContext` or dependencies.** Mocking skips routing, adapter translation, content‑type/headers, validation, and error mapping—the actual contract the controller must satisfy.
  * Real HTTP tests catch **wiring mistakes** (routes, middleware), **serialization issues** (dates/enums), and **data leaks** that unit tests with mocks miss.
  * **Prefer real dependencies.** Run tests as close to production as possible: real adapter, **real database/schema** (via **Docker Compose** or **Testcontainers**), real migrations, real configuration. Use fakes only when a real dependency is impossible, and backstop with CI that runs the **fully integrated** suite.

### Services

**Purpose:** Decouple business/use-cases from transport when a dedicated orchestration layer improves clarity. Services are supported, not mandatory.

* **Responsibilities:** implement app-specific business rules and orchestrate repositories and other services when that extra layer earns its cost.
* **Inputs/Outputs:** accept plain, parsed inputs (DTOs coming from the controller) and return **app‑defined result types** (domain models or DTOs). **Do not leak** ORM rows, query builders, or third‑party library types across the service boundary.
* **Boundary, not framework:** services are **app-specific** and act as a boundary. **Do not implement a framework interface** for services. If an interface is needed, it’s for **dependencies**, not for the service itself.
* **Construction:** constructor injection.
* **Transport‑agnostic:** no knowledge of HTTP (`HttpContext`), views, or serialization concerns.
* **Data access:** services may use repositories when a repository layer improves clarity, but a simple module does not need a service just to forward calls.
* **Testing:** instantiate the service **directly** and assert its methods’ behavior. It shouldn’t matter where inputs came from (HTTP, jobs, CLI) — the service should behave the same. **Prefer real dependencies**.

### Service Extraction

When controller-led code stops being the simplest clear implementation, consider extracting a service as the first refactoring step.

Useful signals:

* the same use-case logic is reused outside one HTTP action
* transaction handling becomes repetitive or hard to follow
* business rules are getting mixed into HTTP branching
* understanding the controller takes longer than changing it
* moving the use case into a service makes the next change easier now

Do not extract a service because of arbitrary size, table-count, or branching-count thresholds. If a service only forwards calls or hides simple SQL, inline it.

### Repositories (Data Access)

**Purpose:** Isolate persistence when a dedicated persistence boundary improves clarity. Repositories are supported, not mandatory.

* **No enforced pattern:** The framework **does not enforce any DB/data‑access pattern**. Use raw SQL, a query builder (e.g., Knex), an ORM, HTTP APIs, filesystem—whatever fits your app and team.
* **Contract first:** when repositories exist, the consuming layer defines the contract it needs.
* **One persistence-boundary option:** repositories are one supported place to own persistence. Simpler modules may keep persistence in a controller or another local abstraction when that is clearer.
* **Parse rows at the boundary:** database rows are external input too. Whoever owns persistence must validate and parse raw rows before returning trusted shapes/DTOs to the rest of the app.
* **Return shapes, not entities:** There is **no requirement to cast DB rows into domain entities**. Return the **contracted shapes/DTOs** expected by the service. Map to domain models **only** if you need domain behavior (see Domain Models below).
* **Scope:** handle persistence concerns (queries, connection errors, unique constraints) when this layer exists.

### Domain Models (Behavioral, not Anemic)

(Behavioral, not Anemic)

**Purpose:** Encapsulate domain behavior and invariants—not just data.

* **Discouraged:** anemic models (data bags with getters/setters and no behavior).
* **When to map rows → models:** **only if** there is domain logic to perform (e.g., calculations, state transitions, policy checks). Otherwise return a plain DTO tailored to the use‑case.
* **Minimal data only:** even when mapping to a model, include **only the fields necessary** for the operation—not the entire DB row.
* **Why:** reduces coupling to storage, avoids over‑fetching and accidental data exposure, keeps public surfaces small, strengthens invariants at the model boundary, and improves testability.

### Dependency Injection

**Purpose:** Make wiring explicit and compile‑time verified.

* **Constructor injection only.**
* **No decorators or DI containers.** No runtime reflection/metadata; everything stays type‑checked.
* **Replaceability:** swap implementations per environment by changing what you pass to constructors—no code changes.

## Linting & Formatting

Uses **Biome** for linting and formatting.

---

## Testing

* Uses the **Node.js test runner** (`node --test`) with strict assertions.
* Test **public behavior** (black‑box). Avoid mocking internals.
* **Prefer real dependencies** and black‑box tests.
* Do not write unit tests for controller internals, temporary helper functions, or code that is likely to be refactored soon.
* Test behavior, not structure.
