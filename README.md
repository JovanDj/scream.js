# ScreamJS

**A TypeScript‑first web framework with strict DI, SOLID design, and zero magic.**

> ⚠️ **Status & Intended Use**
>
> ScreamJS is **not production‑ready**. It is **actively developed** and intended **only for testing and educational purposes** at this stage. APIs and behavior may change without notice.

ScreamJS is a handcrafted, **opinionated, batteries‑included** framework focused on **clarity over magic**. It gives you composable building blocks—**Controllers → Services → Repositories**—with **constructor injection**, no global singletons, and adapters so you can swap HTTP servers or data layers without rewriting your app.

---

## Why ScreamJS?

* **Strict DI** – dependencies are explicit and compile‑time type‑checked.
* **SOLID & composition** – no inheritance pyramids; small parts, well‑defined extension points.
* **Framework‑agnostic HTTP** – plug in Express or Koa (or your own adapter).
* **Typed persistence** – repository/data‑mapper patterns; DB choice is yours.
* **Opinionated defaults** – conventions over configuration; clear stances to keep projects consistent.
* **First‑party batteries** – include as many batteries as practical and hand‑craft them when possible. Third‑party dependencies are **wrapped behind interfaces** and chosen with a **preference for MIT licenses**.
* **Zero surprises** – ESM‑only, Node 22+, strict TypeScript, **Biome** for lint/format.

## Opinionated & Batteries‑Included

ScreamJS intentionally ships with **strong opinions** and **as many first‑party batteries as practical**. The goal is to give you a productive, consistent baseline without hidden magic:

* **Handcrafted batteries**: core capabilities are built in‑house where feasible to keep behavior predictable and docs cohesive.
* **Interfaces at the edges**: when a third‑party tool is used, it is wrapped behind a small interface so implementations can be swapped without leaking details into your domain.
* **License posture**: prefer **MIT‑licensed** dependencies.
* **Conventions first**: prefer sensible defaults and well‑defined extension points instead of sprawling configuration.

---

## TypeScript Strictness

TypeScript is configured with **maximum strictness** (e.g., `"strict": true` and related checks) in a single-source `tsconfig`. Settings are **never changed per environment or at runtime**—no ts-node loaders, env-specific extends, or ad‑hoc overrides.

* Uses `erasableSyntaxOnly` so only **erasable type syntax** is allowed; the compiler emits plain JavaScript with no TS‑specific runtime semantics.

---

## Core Concepts

### Controllers

**Purpose:** Accept HTTP input, validate/normalize it, call a service, and map the result to an HTTP response.

* **HTTP context:** Each controller method receives an injected **`HttpContext`** from the adapter. It encapsulates request data (method, path params, query, headers, cookies, body) and response operations (set status/headers, send/render). The **`HttpContext` interface is uniform across adapters** (Express, Koa, etc.), keeping controllers server‑agnostic.
* **Validation:** `HttpContext` integrates a request validator. **First‑party support is `Zod`**; other validators can be plugged behind the same interface. Use it to validate and coerce params/query/body before calling services.
* **Responsibilities:** perform lightweight request validation, call the appropriate service, and translate results to **response DTOs** and **status codes**; map domain errors to HTTP codes.
* **Inputs/Outputs:** take method + request data; produce a response DTO and status. **Never surface ORM rows or persistence errors directly.**
* **Types & DTOs:** define **independent types** for HTTP **request inputs** and **response DTOs** (template or JSON). Always **map** service/domain results into these DTOs; do **not** pass domain models straight to the view/JSON.
* **Why not return service output directly?** Decouples transport from domain, allows API/view‑model versioning without touching core logic, hides internal fields, enforces serialization (dates/enums), and reduces the risk of leaking sensitive data.
* **Do:** keep them thin; call as many service methods as needed, but depend **only on service return types** (never on domain/persistence types).
* **Don’t:** reach into DBs or caches; embed business rules.
* **Testing:** Treat controllers as **black‑box HTTP**. Use a real HTTP test client (e.g., **SuperTest**) to send requests against the running adapter and assert **status, headers, and body**.

  * **Don’t mock `HttpContext` or dependencies.** Mocking skips routing, adapter translation, content‑type/headers, validation, and error mapping—the actual contract the controller must satisfy.
  * Real HTTP tests catch **wiring mistakes** (routes, middleware), **serialization issues** (dates/enums), and **data leaks** that unit tests with mocks miss.
  * **Prefer real dependencies.** Run tests as close to production as possible: real adapter, **real database/schema** (via **Docker Compose** or **Testcontainers**), real migrations, real configuration. Use fakes only when a real dependency is impossible, and backstop with CI that runs the **fully integrated** suite.

### Services

**Purpose:** Decouple business/use‑cases from transport. A controller **injects** a service; a service may **inject other services** and repositories. Controllers are **never** injected into anything.

* **Responsibilities:** implement app‑specific business rules; orchestrate repositories and (optionally) other services.
* **Inputs/Outputs:** accept plain, validated inputs (DTOs coming from the controller) and return **app‑defined result types** (domain models or DTOs). **Do not leak** ORM rows, query builders, or third‑party library types across the service boundary.
* **Boundary, not framework:** services are **app‑specific** and act as a boundary. **Do not implement a framework interface** for services. If an interface is needed, it’s for **dependencies** (e.g., repositories), not for the service itself.
* **Construction:** constructor injection.
* **Transport‑agnostic:** no knowledge of HTTP (`HttpContext`), views, or serialization concerns.
* **Data access via repositories:** While app developers are free to structure service internals as they see fit, **prefer accessing data through repositories**. The service **declares the repository interface it depends on**, and **repository providers implement that interface**. This keeps the service independent of storage details and allows swapping implementations without changing service code.
* **Testing:** instantiate the service **directly** and assert its methods’ behavior. It shouldn’t matter where inputs came from (HTTP, jobs, CLI) — the service should behave the same. **Prefer real dependencies**.

### Repositories (Data Access)

**Purpose:** Isolate persistence behind an interface the **service** declares.

* **No enforced pattern:** The framework **does not enforce any DB/data‑access pattern**. Use raw SQL, a query builder (e.g., Knex), an ORM, HTTP APIs, filesystem—whatever fits your app and team.
* **Contract first:** the **service defines** the repository interface it needs; any implementation that satisfies the interface is valid.
* **Return shapes, not entities:** There is **no requirement to cast DB rows into domain entities**. Return the **contracted shapes/DTOs** expected by the service. Map to domain models **only** if you need domain behavior (see Domain Models below).
* **Scope:** handle persistence concerns (queries, connection errors, unique constraints); **no business logic**.

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
