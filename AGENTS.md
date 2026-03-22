# ScreamJS Working Rules

These rules are mandatory for new code and refactors. If another doc conflicts, this wins.

## Goal

Build the simplest system that works well as soon as possible.

Prefer:

* direct code over layered indirection
* fewer files over textbook separation
* real behavior over architectural purity
* local clarity over abstract reuse

Avoid introducing structure unless it clearly pays for itself now.

---

## 1) Simplicity first

* The default solution is the shortest clear path to working behavior.
* A module may collapse controller, orchestration, and persistence into one file if that is the simplest workable design.
* Delete unused layers aggressively.
* Do not preserve abstractions just because they are conventional.

Abstractions are justified only when they remove real duplication or make a current change materially easier.

---

## 2) Module structure

* Keep code under `src/modules/<module>/`.
* No subfolders inside a module.
* File names are descriptive, not mandatory architecture boundaries.
* `index.ts` should expose the smallest useful module API.
* `export *` is still discouraged; prefer explicit exports.

Allowed examples:

* controller-only module
* controller + schema
* controller + small helper file
* service/mapper split, but only if it is currently useful

There is no requirement to keep controller, service, mapper, repository, and domain files if they do not earn their cost.

---

## 3) Controllers and DB access

* Controllers may take `db` directly.
* Controllers may perform queries, writes, and transactions directly when that is the simplest option.
* Controllers may contain business logic if extracting it would only create ceremony.
* Keep controller methods readable. If a method gets too long, extract a local private helper before introducing a new layer.

Prefer explicit local helpers over creating new service or mapper classes.

---

## 4) Transactions and dependencies

* No ambient DB globals inside modules. Pass `db` explicitly.
* If a transaction is needed, start it in the place that currently owns the behavior, including a controller.
* Inside a transaction, consistently use `tx`.
* External I/O should still stay out of DB transactions unless there is a strong reason not to.

---

## 5) Types and schemas

* Keep only the types that help current code stay clear and safe.
* Schema files are useful for request validation and boundary parsing, but they are optional if inline validation is clearer.
* Domain models are optional. Keep them only if they contain real behavior worth isolating.
* Read models and write models may be separate or combined. Choose the simpler shape for the current use case.

---

## 6) No premature abstraction

Do not add:

* base classes
* generic repositories
* generic mappers
* indirection-only interfaces
* “future-proof” layers

Add a new abstraction only when the current code is harder to change because the abstraction is missing.

---

## 7) Testing

* Use `node --test`.
* Test observable behavior.
* Prefer a small number of integration-style tests over many brittle unit tests.
* Keep tests colocated with the module they cover.
* DB-backed tests must still isolate their state and clean up after themselves.
* If a layer no longer exists, its tests should be removed or folded into higher-level tests.

Good default test targets:

* HTTP behavior for controller-driven modules
* DB-visible outcomes for persistence-heavy flows
* small pure tests only where logic is genuinely easier to verify in isolation

---

## 8) Practical code quality

* Keep functions short enough to scan quickly.
* Prefer straightforward names and explicit data flow.
* Avoid `as` casts unless there is no cleaner practical option.
* Keep comments rare and useful.
* Refactor only when it makes the next change easier or the current code clearer.

The best design here is the one that keeps shipping speed high without making the next few changes painful.
