# ScreamJS Architecture Rules

These rules are **mandatory** for new code and refactors. If another doc conflicts, **this wins**.

## Core direction

* **Framework-first repo**: the framework is the primary product; the app is its proving ground.
* **Modular monolith**: one deployable system with strong internal module boundaries.
* **Clean Architecture inside modules**: dependencies point inward toward application policy and domain behavior.
* **Flat modules**: **no subfolders** inside `src/modules/<module>/`.
* **Strict DI**: composition roots own wiring; high-level code depends on contracts, not infrastructure.
* **Law of Demeter**: each layer talks only to its direct collaborators.
* **Framework as full platform**: app modules should consume framework-provided capabilities rather than bypassing them with direct third-party usage.
* **No ambient context**: dependencies and DB handles are explicit.

---

## 1) Module shape and roles

### 1.1 Module boundary

* Module path: `src/modules/<module>/`
* **No subfolders** inside a module.
* No horizontal app folders:

  * `src/controllers/**`
  * `src/services/**`
  * `src/repositories/**`
  * `src/schemas/**`
  * `src/mappers/**`

### 1.2 File roles

* `<module>.controller.ts` — framework-facing adapter, request parsing, validation, response mapping
* `<module>.service.ts` — application/use-case orchestration and transaction coordination
* `<module>.ts` — domain entity/model behavior and invariants
* `<module>.repository.ts` — repository contract and/or concrete persistence adapter
* `<module>.schema.ts` — boundary schemas for persistence/input/output shapes
* `<module>.mapper.ts` — translation between boundary/persistence shapes and domain shapes
* `index.ts` — explicit module API (**no `export *`**)

### 1.3 Minimal example layout

```text
src/modules/todo/
  index.ts
  todo.controller.ts
  todo.service.ts
  todo.ts
  todo.repository.ts
  todo.schema.ts
  todo.mapper.ts
```

---

## 2) Dependency direction

* Domain depends on nothing external to the module’s policy core.
* Application depends on domain and boundary contracts.
* Controllers/adapters depend on framework APIs and application services.
* Infrastructure/repositories depend on framework persistence primitives and module contracts.
* Only the application composition layer may wire concrete implementations.
* High-level policy code must not depend on concrete infrastructure details.

### 2.1 Port ownership rule

* Interfaces/ports are defined in the layer that uses them, not in the layer that implements them.
* Application services define the repository ports they need.
* Infrastructure/repository adapters implement those ports.
* The implementation layer must not own the abstraction used by higher-level policy.
* Composition roots wire ports to adapters.
* Anti-pattern: defining an interface in the infrastructure layer and making the service depend on it is **not** dependency inversion, even if the service technically imports an interface.

### 2.2 Flat module interpretation

* In a flat module, a repository contract still belongs to the application side of the module boundary.
* Adapter implementations may live in the same flat module, but they remain clearly secondary to the application-owned port.
* A file that mixes both port and adapter is a transitional state, not the target pattern.

### 2.3 Framework platform rule

* Application modules should prefer framework-provided capabilities by default.
* App modules should not directly import third-party libraries when the framework should provide that capability.
* Direct app-level third-party usage is an exception and should indicate a framework gap.
* Framework packages may wrap third-party libraries internally without leaking them into app code.
* Domain and application code should use the smallest stable contract that satisfies the use case.

---

## 3) Layer responsibilities

### 3.1 Controllers / adapters

Controllers:

* use framework APIs at the edge
* validate and parse incoming data
* call one application service / use case
* map outcomes to HTTP or other adapter responses

Controllers must not:

* access SQL / DB clients directly
* contain business rules
* start transactions
* leak framework concerns into domain/application contracts unnecessarily

### 3.2 Application services

Application services:

* orchestrate use cases
* own transaction boundaries
* coordinate repositories and domain objects
* depend on contracts rather than infrastructure when a boundary is justified

Application services must not:

* contain SQL/query building
* depend directly on framework adapter types
* call external systems inside DB transactions

### 3.3 Domain

* Domain behavior is DB-free and framework-agnostic.
* Domain entities/models enforce invariants and state transitions.
* Domain code should not know row field names, transport DTOs, or adapter concerns.

### 3.4 Schemas, mappers, repositories

* Schemas validate boundary data.
* Mappers translate between persistence/input shapes and domain shapes.
* Repositories encapsulate persistence concerns.
* Repository contracts define what the application needs, not what the DB exposes.
* Repository contracts are owned by the consuming application layer; repository implementations are infrastructure adapters.

---

## 4) Transactions and infrastructure access

* Application services own transaction boundaries.
* Controllers/adapters must never start transactions.
* Repositories participate in transactions through explicit handles passed from the application layer.
* Every DB call path must receive a handle explicitly:

  * outside a transaction: pass the pool `db`
  * inside a transaction: pass the `tx`

* No global singleton DB access inside modules.
* Inside `db.transaction((tx) => ...)`, every DB call uses **`tx`**, never the pool.
* External I/O (email/webhooks/pubsub) must not run inside DB transactions.

---

## 5) No premature abstraction

* Do not introduce abstractions before there is a concrete need.
* Forbidden by default: generic base classes, generic helper wrappers, indirection-only adapters, and “future-proof” interfaces not required by current behavior.
* Abstractions are justified when one of these is true:
  * duplication exists in 2+ production call sites,
  * complexity has clearly outgrown a simpler design,
  * a framework or architecture boundary requires a contract for decoupling,
  * the abstraction is required to preserve Clean Architecture dependency direction.
* When an abstraction is kept with fewer than 2 concrete usages, add a short in-file comment explaining the trigger that justifies it.

---

## 6) Compile-time safety

* No ambient DB globals
* No `unknown` in service/domain public APIs
* No `as` casts in production code
* Keep contracts narrow and explicit

---

## 7) Testing rules

### 7.1 Global posture

* Use **Node.js test runner**: `node --test`.
* Tests assert **observable behavior**, not implementation details.
* Prefer pure, fast tests for domain behavior.
* Use real wiring for integration tests.
* Service integration tests are acceptable and often preferred when they verify real application behavior through production wiring.
* Test doubles are acceptable at architectural boundaries when they improve unit isolation and do not couple tests to implementation details.
* All tests must be isolated and safe to run concurrently by default.
* Tests must not depend on execution order or shared mutable state.

### 7.2 Test placement

* Tests are colocated with the module they test:

  * `src/modules/<module>/<module>.controller.test.ts`
  * `src/modules/<module>/<module>.service.test.ts`
  * `src/modules/<module>/<module>.repository.test.ts`
  * `src/modules/<module>/<module>.test.ts` (domain/model tests)

### 7.3 Layered testing

* Controller tests are HTTP black-box tests through a real app.
* Domain tests are pure, fast, and infrastructure-free.
* Service tests focus on orchestration and observable outcomes.
* Repository tests use a real test database.

### 7.4 DB isolation and concurrency

* Any test that touches the database must provision **isolated DB state per test invocation**.
* DB-backed tests must be safe to run concurrently.
* Disabling concurrency is a last resort and indicates a fixture or design problem, not the default strategy.
* Framework test fixtures must guarantee isolation for supported test styles.
* Each DB test must clean up after itself (or use a helper that does cleanup automatically).

### 7.5 Test quality rules

* Each test verifies **one behavior**.
* Keep tests minimal: arrange → act → assert.
* Do not assert implementation details like:

  * private method calls
  * SQL string usage
  * dependency invocation counts
  * internal field/state inspection

Allowed assertions:

* returned values
* thrown typed errors
* HTTP status/headers/body
* DB-visible final state **only when that is the behavior being tested**
