# Database Adapter Interface Design

## Status

Approved design for a specification-only pull request. This document defines the intended public database abstraction and adapter boundary. It does not implement the interface.

## Problem

Scream.js currently exposes Knex directly as the application-facing `Database` type:

```ts
export type Database = Knex;
```

That makes application modules depend on Knex's API and semantics even when they import it through `@scream.js/database`. As a result, replacing Knex would require changes in application code.

This conflicts with the existing HTTP architecture, where applications depend on stable Scream contracts such as `Application` and `HttpContext`, while Express, Koa, and the native Scream HTTP implementation are interchangeable adapters beneath those contracts.

The database architecture should follow the same rule.

## Goal

Applications must depend only on stable Scream-owned database contracts. Concrete query implementations must be replaceable without changing application modules.

The intended architecture is:

```text
Application modules
       |
       v
Scream database contracts
       |
       +------------------+
       |                  |
       v                  v
Knex adapter       Scream query adapter
       |                  |
       v                  v
     Knex          ScreamQueryBuilder
```

Knex and the handcrafted Scream query builder are peer implementations of the same public database contracts. Neither is the public abstraction.

## Core design rule

**Applications may depend on Scream database contracts, but never on a concrete database adapter or its implementation types.**

A database adapter is considered swappable only if an application can change adapters without modifying code under `src/modules/`.

## Public contracts

The public API should be defined in adapter-neutral modules such as:

```text
lib/database/
  database.ts
  query.ts
  transaction.ts

  knex/
  scream/
```

Exact filenames may change during implementation, but the dependency direction must not.

The initial public contracts should be capability-oriented and minimal. They should expose only behavior already required by real applications.

A representative shape is:

```ts
export interface Database {
  from(table: string): SelectQuery;
  insertInto(table: string): InsertQuery;
  update(table: string): UpdateQuery;
  deleteFrom(table: string): DeleteQuery;

  transaction<T>(
    work: (tx: Database) => Promise<T>,
  ): Promise<T>;

  close(): Promise<void>;
}
```

The concrete method names are not fixed by this document. The implementation PR may adjust naming if it improves ergonomics, but the following invariants are mandatory:

1. The types are owned by Scream, not aliased from Knex or another library.
2. Query objects are interfaces/contracts, not concrete implementation classes.
3. No public contract references Knex, `Knex.QueryBuilder`, Kysely, SQLite driver types, or ScreamQueryBuilder implementation types.
4. Transactions expose the same `Database` contract as normal application code.
5. The contract stays small and grows from application pressure rather than by mirroring an existing library.

## Query contracts

The database abstraction should not be one monolithic `Query` interface if separate capability-oriented interfaces provide clearer typing.

Likely contracts include:

```ts
export interface SelectQuery {
  select(...columns: string[]): SelectQuery;
  where(condition: WhereCondition): SelectQuery;
  join(join: Join): SelectQuery;
  orderBy(column: string, direction?: "asc" | "desc"): SelectQuery;
  limit(limit: number): SelectQuery;

  first<T>(): Promise<T | undefined>;
  all<T>(): Promise<T[]>;
}

export interface InsertQuery {
  values(value: Record<string, unknown>): InsertQuery;
  returning(...columns: string[]): InsertQuery;
  execute<T>(): Promise<T>;
}

export interface UpdateQuery {
  set(value: Record<string, unknown>): UpdateQuery;
  where(condition: WhereCondition): UpdateQuery;
  execute(): Promise<number>;
}

export interface DeleteQuery {
  where(condition: WhereCondition): DeleteQuery;
  execute(): Promise<number>;
}
```

These examples describe the intended boundary, not the final API surface. The implementation should start from operations already used by Todo, Project, Tag, and other reference-app flows.

## Knex adapter

Knex becomes one adapter implementation beneath the stable contracts.

Representative structure:

```text
lib/database/knex/
  knex-database.ts
  knex-select-query.ts
  knex-insert-query.ts
  knex-update-query.ts
  knex-delete-query.ts
```

Representative implementation shape:

```ts
export class KnexDatabase implements Database {
  constructor(private readonly knex: Knex) {}

  from(table: string): SelectQuery {
    return new KnexSelectQuery(this.knex(table));
  }

  async transaction<T>(
    work: (tx: Database) => Promise<T>,
  ): Promise<T> {
    return this.knex.transaction((trx) =>
      work(new KnexDatabase(trx)),
    );
  }

  async close(): Promise<void> {
    await this.knex.destroy();
  }
}
```

Knex types are allowed inside `lib/database/knex/**` only. They must not appear in application modules or public database contracts.

The Knex adapter may internally use Knex's fluent query builder, but that fluent API is not exposed directly to applications.

## Scream query adapter

The existing handcrafted Scream query builder is an alternative adapter, not the definition of the database API.

Representative structure:

```text
lib/database/scream/
  scream-database.ts
  scream-select-query.ts
  ...
```

Its implementation may use `ScreamQueryBuilder`, `Connection`, `SqlQuery`, and the existing direct SQLite connection internally.

The application-facing behavior must match the same `Database` and query contracts implemented by the Knex adapter.

This preserves the intended symmetry with HTTP:

```text
HTTP contracts             Database contracts
      |                           |
  +---+---+                   +---+---+
  |   |   |                   |       |
Express Koa Scream          Knex   Scream query
```

## Composition

Adapter selection belongs at the composition boundary.

Application modules continue to receive only `Database`:

```ts
const db: Database = createDB(config);

TodoModule.create(db);
ProjectModule.create(db);
```

`createDB()` may choose an adapter from configuration or explicit composition, but module code must not know which adapter was selected.

The application must not instantiate `KnexDatabase`, `ScreamDatabase`, or other concrete implementations inside feature modules.

## Transaction behavior

Transactions are part of the stable contract.

Application code should be able to write:

```ts
await db.transaction(async (tx) => {
  // same Database contract inside the transaction
});
```

The concrete adapter owns transaction creation and commit/rollback behavior.

This preserves the existing architecture rule that transaction boundaries stay visible at the use-case owner and are not hidden inside low-level helpers.

## Raw/native escape hatches

A raw or adapter-native escape hatch must not silently undermine portability.

If Scream exposes raw SQL or native access later, it must be explicitly marked as non-portable. Portable application paths must continue to use the stable contracts.

The initial implementation should not expose adapter-native Knex objects through the public API.

## What must not be done

The implementation must not:

- keep `export type Database = Knex`;
- alias `Query` to `Knex.QueryBuilder`;
- expose Knex callback types through public contracts;
- copy the full Knex API into Scream interfaces;
- make ScreamQueryBuilder the public abstraction;
- add generic repository/service layers solely to hide the adapter;
- require feature modules to branch on which adapter is active;
- introduce speculative query capabilities that no current application uses.

## Contract testing

Swappability must be verified behaviorally, not assumed from matching TypeScript interfaces.

A shared database adapter contract suite should run against every supported adapter, for example:

```ts
runDatabaseContractTests(() => createKnexDatabase());
runDatabaseContractTests(() => createScreamDatabase());
```

The common suite should verify at least the capabilities present in the initial stable interface, including:

- selecting rows;
- selecting one row;
- filtering;
- joining when part of the stable API;
- ordering and limiting when part of the stable API;
- inserts;
- updates;
- deletes;
- transaction commit;
- transaction rollback;
- parameter safety;
- adapter-independent result semantics.

Adapter-specific tests may exist in addition to the contract suite.

## Acceptance criteria for the implementation PR

The future implementation is complete when all of the following are true:

1. `Database` is a Scream-owned interface and is not a Knex alias.
2. Application modules import only stable Scream database contracts.
3. No file under `src/modules/` imports Knex or a concrete database adapter.
4. Knex is isolated under its adapter implementation.
5. The handcrafted Scream query implementation satisfies the same public contracts as the Knex adapter.
6. Todo and Project behavior can run against either adapter without source changes under `src/modules/`.
7. Both adapters pass the same database contract test suite.
8. Existing HTTP-boundary behavior tests remain unchanged unless behavior itself changes.
9. The public API contains no speculative methods added solely to match Knex.

## Migration strategy

The implementation should be incremental:

1. Define the minimal stable contracts required by the current Todo/Project application flows.
2. Implement those contracts with a Knex adapter.
3. Change `createDB()` to return the stable `Database` contract rather than Knex.
4. Migrate application code from direct Knex calls to the stable query contracts without changing application behavior.
5. Adapt the existing Scream query builder to the same contracts.
6. Add the shared adapter contract suite.
7. Prove the reference app runs unchanged against both implementations.

The public API should grow only when additional real application behavior requires it.

## Design principle

This database boundary should evolve by the same extraction rule used elsewhere in Scream:

> Stable interfaces describe application-required capabilities; adapters implement them. Concrete libraries do not define the application architecture.

This keeps Knex replaceable, keeps the handcrafted query builder optional, and lets future adapters be introduced without rewriting application code.
