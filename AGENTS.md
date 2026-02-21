# ScreamJS App Rules (Flat Modules, Step 1 Baseline)

These rules are **mandatory** for new code and refactors. If another doc conflicts, **this wins**.

## Core direction

* **Modular monolith**: modules are vertical slices in one deployable codebase.
* **Flat modules**: **no subfolders** inside `src/modules/<module>/`.
* **Step 1 baseline**: **Transaction Script + Active Record**.
* **No ambient context**: DB handle is always explicit.

---

## 1) Module shape and file roles

### 1.1 Module boundary

* Module path: `src/modules/<module>/`
* **No subfolders** inside a module.
* No horizontal app folders:

  * `src/controllers/**`
  * `src/services/**`
  * `src/repositories/**`

### 1.2 File naming by role

**Presentation**

* `<module>.controller.ts` — HTTP, Zod validation, **one service call**

**Application**

* `<module>.service.ts` — transaction scripts + orchestration

**Model (Active Record)**

* `<module>.ts` — model + persistence methods + row parsing

**Public API**

* `index.ts` — explicit allowlist exports (**no `export *`**)

### 1.3 Minimal example layout

```text
src/modules/todo/
  index.ts
  todo.controller.ts
  todo.service.ts
  todo.ts
```

---

## 2) Dependency direction

* Controller **may import**: service
  Controller **must not import**: `Knex`, query builders, DB clients
* Service **may import**: model
  Service **must not contain**: SQL text / query construction
* Model behavior **must not require DB** parameters
* Model persistence methods **must accept** either `Knex` or `Knex.Transaction`
* External I/O (email/webhooks/pubsub) **must not run inside** DB transactions
* Framework code in `lib/**` **must not import** from `src/**`
* Framework code in `lib/**` **must not import** app aliases like `@/**` or `@/modules/**`
* Only the application composition layer may wire framework components to app modules

---

## 3) Step 1 canonical workflow

**Controller → Service → Active Record → DB → View**

---

## 4) Transactions (writes)

### 4.1 One write operation = one transaction *when needed*

Service **must** wrap in one transaction when:

* multi-query write, or
* any state-dependent read-modify-write

Service **should skip** transaction when:

* exactly one SQL statement and no state-dependent logic

Controller **must never** start transactions.

### 4.2 Pass the DB handle explicitly (no ambient)

* Every DB call path must receive a handle explicitly:

  * outside a transaction: pass the pool `db`
  * inside a transaction: pass the `tx`
* No global singleton DB access inside modules.

### 4.3 No mixing pool + tx

Inside `db.transaction((tx) => ...)`, every DB call uses **`tx`**, never the pool.

---

## 5) Controllers (thin + dumb)

Controllers **do only**:

* validate input with Zod via `ctx.param(...)` / `ctx.body(...)`
* call **one** service method
* map outcomes to HTTP (200/302/404/422/409/etc.)

Controllers **do not**:

* SQL / DB access
* business rules
* transaction boundaries

Validation failures:

* return **422** (or render form with errors + status 422)

Not-found:

* service returns `undefined` **or** throws a typed error; controller maps to **404**

---

## 6) Services (transaction scripts)

Service methods **do**:

* start transaction when required (Section 4)
* load records, apply rules, persist

Service methods **do not**:

* contain SQL/query building
* call external systems inside transactions

Keep scripts readable:

* extract **pure helpers** (no DB) if needed
* don’t introduce extra layers prematurely

---

## 7) Active Record (model + persistence)

Persistence methods accept `Knex` or `Knex.Transaction` explicitly:

* `Todo.findById(dbOrTx, id)`
* `todo.save(dbOrTx)`
* `Todo.create(dbOrTx, input)`

Row parsing/mapping lives **inside** the model file (`<module>.ts`). No separate files in Step 1.

Domain behavior is DB-free:

* `todo.rename(title)` ✅
* `await todo.rename(db, title)` ❌

Mutability:

* Step 1 allows mutable or immutable models; pick the simplest and be consistent.

---

## 8) Correctness and concurrency

If correctness depends on row state:

* use `SELECT ... FOR UPDATE` inside the transaction, **or**
* atomic `UPDATE ... WHERE ...` + verify affected rows

DB invariants are mandatory backstops:

* `UNIQUE`, `FK`, obvious `CHECK` constraints

---

## 9) Errors and rollback

* Prefer typed errors (classes) over string branching (can live in the same file as service/model in Step 1).
* Throw inside transaction callback to rollback; do not swallow errors.
* Forbidden pattern: outer `let` assigned in `try` then used after `catch`.

---

## 10) Compile-time safety

* No ambient DB globals
* No `unknown` in service/model public APIs
* No `as` casts in production code

---

## 11) Module API and imports

* Each module exports via `src/modules/<module>/index.ts` (explicit allowlist)
* Cross-module imports use `@/modules/<module>`
* Alias **must resolve at runtime**; otherwise don’t use it.

---

## 11.1) Auth Contract (Framework vs App)

* Framework adapters **must not own** app auth routes, app auth views, or app credential policy.
* Application modules own auth/session policy and route behavior.
* Framework auth/session primitives, when present, must remain app-agnostic and reusable across apps.

### Cross-adapter parity checklist

* Express/Koa/Scream adapters expose equivalent HTTP context primitives (params/body/query/render/redirect/error responses).
* No adapter leaks app-specific persistence or policy assumptions through `HttpContext`.

---

## 12) Leaving Step 1 triggers

Introduce shared helpers/repositories later when:

* SQL copied in 2+ places
* validation repeated in 2+ places
* services hit 5+ queries + branching complexity
* value objects needed (`Money`, `TimeRange`, etc.)

## 12.1) No Premature or Speculative Abstraction

* Do not introduce abstractions before at least 2 concrete call sites or a demonstrated complexity trigger from Section 12.
* Forbidden by default: generic base classes, generic helper wrappers, indirection-only adapters, and "future-proof" interfaces not required by current behavior.
* Allowed only when one of these is true:
  * duplication exists in 2+ production call sites,
  * complexity threshold in Section 12 is met,
  * framework boundary requires a contract for decoupling.
* When an abstraction is kept with fewer than 2 concrete usages, add a short in-file comment explaining the trigger that justifies it.

---

## 13) Testing rules (Step 1)

### 13.1 Global testing posture

* Use **Node.js test runner**: `node --test`.
* Tests assert **observable behavior**, not implementation details.
* **No mocks** for first-party code (controllers/services/models). Prefer real wiring.

### 13.2 Test file placement and naming

* Tests are colocated with the module they test:

  * `src/modules/<module>/<module>.controller.test.ts`
  * `src/modules/<module>/<module>.service.test.ts`
  * `src/modules/<module>/<module>.test.ts` (model tests only if needed)
* Use `*.test.ts` only.

### 13.3 Controller tests (HTTP black-box)

Controllers are only tested through a real HTTP app:

* Start a real app with the real controller + routes registered.
* Use real HTTP requests (`fetch`) and assert:

  * status code
  * redirects
  * response body (HTML/text) contains expected output
* **Do not** unit-test controller methods directly.
* **Do not** mock `HttpContext`.

### 13.4 Service tests (direct, real DB)

Services are tested by instantiating the service and calling methods directly:

* Use a **real test database** (and real schema/migrations).
* Assert service outputs and user-visible outcomes (e.g., returned model fields, not internal query behavior).
* Do not re-verify persistence side effects in the same test unless that side effect is the behavior under test.

### 13.5 DB test isolation and concurrency

* Any test that touches the database must run with **isolated DB state** per test.
* If isolation is not guaranteed, DB tests **must disable concurrency** (suite-level or file-level).
* Each DB test must clean up after itself (or use a helper that does cleanup automatically).

### 13.6 One behavior per test

* Each test verifies **one behavior**.
* Keep tests minimal: arrange → act → assert.
* Avoid multiple unrelated assertions that describe different behaviors.

### 13.7 Inputs and validation

* Controller tests cover:

  * valid inputs
  * invalid inputs → **422** (or your chosen error behavior)
  * not-found → **404**
* Service tests cover:

  * success paths
  * not-found outcomes (`undefined` / typed error)
  * conflict scenarios where applicable

### 13.8 No testing “internals”

Forbidden assertions:

* “this private method was called”
* “this SQL string was used”
* “this dependency function was invoked”
* direct inspection of internal fields/state

Allowed assertions:

* returned values
* thrown typed errors
* HTTP status/headers/body
* DB-visible final state **only when that is the behavior being tested**
