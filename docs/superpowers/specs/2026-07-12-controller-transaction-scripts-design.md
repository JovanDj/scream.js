# Controller Transaction Scripts And Table Gateways

## Goal

Standardize a low-level persistence pattern for ScreamJS applications: controller methods are Transaction Scripts, and plural table gateway classes hide SQL behind a primary physical table.

## Responsibilities

Controllers own the complete HTTP use case. They parse input, validate requests, start Knex transactions for writes, coordinate table gateways, make workflow decisions, map records into ViewModels, and choose render, redirect, or not-found responses.

Table gateways own SQL and database-row parsing. A table gateway is named after its primary physical table and may join or look up related tables. It never starts a transaction, renders a response, or coordinates another table gateway.

Templates continue to receive inert pushed ViewModels under the existing Parr MVC rules.

## Naming And Location

Gateway class names match plural physical table names with a `Table` suffix:

- `ProjectsTable`
- `TodosTable`
- `TagsTable`
- `TodoTagsTable`

Application table gateways live in `src/tables`. Create a gateway only when a current controller workflow uses that table.

Each gateway exposes a static named constructor:

```ts
export class TodosTable {
	static create(db: Database) {
		return new TodosTable(db);
	}

	private constructor(private readonly db: Database) {}
}
```

This supports concise transaction-scoped calls without a registry or general factory:

```ts
const todo = await TodosTable.create(tx).find(id);
```

## Transactions

Controllers receive the root `Database` through constructor injection. Every write action starts the transaction and passes its `tx` handle into each table through `Table.create(tx)`.

```ts
return this.#db.transaction(async (tx) => {
	const todo = await TodosTable.create(tx).find(id);
	const tags = await TagsTable.create(tx).findByIds(tagIds);

	await TodoTagsTable.create(tx).replace(todo.id, tags.map((tag) => tag.id));
});
```

Read-only actions construct tables with the root database and do not start a transaction.

Tables never accept a transaction as a method argument. Binding the executor in the constructor prevents one gateway instance from mixing transaction contexts.

## Query Rules

Table methods expose table-specific operations such as `find`, `list`, `insert`, `updateStatus`, and `replaceForTodo`. They do not expose Knex query-builder methods.

Gateways may use joins and lookup tables when serving operations anchored to their primary table. For example, `TodosTable` may join `todo_statuses` when listing todos or resolve a status ID when updating a todo. Gateways validate raw rows before returning trusted records.

Controllers still own cross-gateway workflow decisions. For example, assigning tags checks the todo through `TodosTable`, checks selected tags through `TagsTable`, and writes junction rows through `TodoTagsTable`.

The design uses no generic repository, base table class, table registry, service layer, dependency interface, or dependency container.

## Module Composition

HTTP modules construct controllers with the root `Database`:

```ts
const controller = new TodosController(db);
```

Controllers construct the table gateways needed by each action. Existing `TodoModel`, `TagModel`, and `ProjectModel` classes are removed after their SQL moves into the plural table gateways.

## Testing

Existing controller HTTP integration tests remain the behavioral contract. Do not add tests for table classes, SQL implementation details, or constructor shape.

Run each module's controller suite before and after its migration. Then run the full integration suite, typecheck, Biome, `git diff --check`, and end-to-end tests because persistence composition changes.

## Documentation

Update `AGENTS.md` and `docs/agent-instructions/architecture.md` to define this as the standard low-level, low-complexity persistence pattern. Keep repositories, services, generic gateways, and domain models optional rather than default layers.
