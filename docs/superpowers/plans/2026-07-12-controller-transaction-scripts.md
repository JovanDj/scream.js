# Controller Transaction Scripts And Table Gateways Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace module-level model hybrids with controller Transaction Scripts and plural per-table SQL gateways.

**Architecture:** Controllers receive `Database`, own write transactions, coordinate table gateways, and build ViewModels. Each table gateway binds a `Database` or Knex transaction through `Table.create(db)`, is named after its primary physical table, may join related tables, and parses raw rows.

**Tech Stack:** TypeScript, Knex, Zod-compatible Scream schema validation, Node test runner.

## Global Constraints

- Preserve current HTTP behavior and Parr MVC template boundaries.
- Name gateway classes after plural physical tables with a `Table` suffix.
- Controllers start write transactions; tables never start transactions.
- Pass database executors through `Table.create(db)`, not table method parameters.
- Keep SQL, including joins, inside table gateways and cross-gateway workflow decisions inside controllers.
- Add no generic table base class, registry, repository, service, interface, or container.
- Keep tests black-box at the controller HTTP boundary; add no table unit tests.
- Do not commit changes until the user reviews them.

---

### Task 1: Document The Persistence Convention

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/agent-instructions/architecture.md`

**Interfaces:**
- Produces: the repository rule used by every later task.

- [ ] **Step 1: Replace the model-class default in `AGENTS.md`**

Document that controller methods are Transaction Scripts, controllers own write transactions, and plural `*Table` classes hide SQL behind a primary physical table.

- [ ] **Step 2: Update architecture guidance**

Add the exact naming examples `TodosTable` and `TodoTagsTable`. State that `Table.create(db)` binds the executor, table methods hide Knex, and tables parse raw rows.

- [ ] **Step 3: Check documentation formatting**

Run: `git diff --check`

Expected: exit 0.

### Task 2: Migrate Projects To Table Gateways

**Files:**
- Create: `src/tables/projects.table.ts`
- Modify: `src/modules/project/project.controller.ts`
- Modify: `src/modules/project/project.module.ts`
- Delete: `src/modules/project/project.model.ts`
- Test: `src/modules/project/project.controller.test.ts`

**Interfaces:**
- `ProjectsTable.create(db: Database): ProjectsTable`
- `ProjectsTable.list(): Promise<readonly Project[]>`
- `ProjectsTable.find(id: number): Promise<Project | undefined>`
- `ProjectsTable.insert(name: string): Promise<number>`
- `ProjectsTable.updateStatus(id: number, statusCode: "active" | "archived"): Promise<boolean>`

- [ ] **Step 1: Run the project characterization suite**

Run: `npm run test:integration -- src/modules/project/project.controller.test.ts --test-reporter=dot`

Expected: all project controller tests pass.

- [ ] **Step 2: Add project table gateways**

Move `projects` SQL and row parsing into `ProjectsTable`. Keep its joins and status lookups private to the gateway.

- [ ] **Step 3: Convert `ProjectController` into the Transaction Script**

Constructor-inject `Database`. For reads, construct `ProjectsTable` with the root database. For `store`, `archive`, and `unarchive`, start `this.#db.transaction()` and construct `ProjectsTable` with `tx`.

- [ ] **Step 4: Simplify module composition and remove the model**

Construct `new ProjectController(db)` in `ProjectModule.create()`. Delete `ProjectModel` and its imports.

- [ ] **Step 5: Run the project suite**

Run: `npm run test:integration -- src/modules/project/project.controller.test.ts --test-reporter=dot`

Expected: all project controller tests pass unchanged.

### Task 3: Migrate Todos To Table Gateways

**Files:**
- Create: `src/tables/todos.table.ts`
- Modify: `src/modules/todo/todo.controller.ts`
- Modify: `src/modules/todo/todo.module.ts`
- Delete: `src/modules/todo/todo.model.ts`
- Test: `src/modules/todo/todo.controller.test.ts`

**Interfaces:**
- `TodosTable.create(db: Database): TodosTable`
- `TodosTable.list(input: { search: string; status: "all" | "completed" | "dueToday" | "open" }): Promise<readonly Todo[]>`
- `TodosTable.find(id: number): Promise<Todo | undefined>`
- `TodosTable.insert(title: string): Promise<number>`
- `TodosTable.update(id: number, input: { statusCode: "completed" | "open"; title: string }): Promise<boolean>`
- `TodosTable.delete(id: number): Promise<boolean>`
- `TodosTable.touch(id: number): Promise<boolean>`

- [ ] **Step 1: Run the todo characterization suite**

Run: `npm run test:integration -- src/modules/todo/todo.controller.test.ts --test-reporter=dot`

Expected: all todo controller tests pass.

- [ ] **Step 2: Add todo table gateways**

Move todo SQL and row parsing into `TodosTable`. Keep joins with `todo_statuses` and lookups in `todo_statuses` and `todo_priorities` private to the gateway.

- [ ] **Step 3: Convert `TodosController` into the Transaction Script**

Constructor-inject `Database`. Start controller-owned transactions for `store`, `update`, and `destroy`, and bind `TodosTable` to `tx`.

- [ ] **Step 4: Preserve read filtering and ViewModel mapping**

Pass parsed filters to `TodosTable.list()`. Keep URL and presentation mapping in the controller.

- [ ] **Step 5: Simplify module composition and remove the model**

Construct `new TodosController(db)` in `TodoModule.create()`. Delete `TodoModel` and its imports.

- [ ] **Step 6: Run the todo suite**

Run: `npm run test:integration -- src/modules/todo/todo.controller.test.ts --test-reporter=dot`

Expected: all todo controller tests pass unchanged.

### Task 4: Migrate Tags And Todo Tags To Table Gateways

**Files:**
- Create: `src/tables/tags.table.ts`
- Create: `src/tables/todo-tags.table.ts`
- Modify: `src/modules/tag/tag.controller.ts`
- Modify: `src/modules/tag/tag.module.ts`
- Delete: `src/modules/tag/tag.model.ts`
- Test: `src/modules/tag/tag.controller.test.ts`

**Interfaces:**
- `TagsTable.create(db: Database): TagsTable`
- `TagsTable.list(): Promise<readonly TagRow[]>`
- `TagsTable.findByIds(ids: readonly number[]): Promise<readonly TagRow[]>`
- `TagsTable.insert(name: string, timestamp: string): Promise<void>`
- `TagsTable.delete(id: number): Promise<boolean>`
- `TodoTagsTable.create(db: Database): TodoTagsTable`
- `TodoTagsTable.replaceForTodo(todoId: number, tagIds: readonly number[]): Promise<void>`
- Consumes `TodosTable.create(db)`, `TodosTable.find(id)`, and `TodosTable.touch(id, timestamp)` from Task 3.

- [ ] **Step 1: Run the tag characterization suite**

Run: `npm run test:integration -- src/modules/tag/tag.controller.test.ts --test-reporter=dot`

Expected: all tag controller tests pass.

- [ ] **Step 2: Add tag table gateways**

Move `tags` SQL into `TagsTable`. Move only `todo_tags` delete and insert SQL into `TodoTagsTable`.

- [ ] **Step 3: Convert `TagController` into the Transaction Script**

Constructor-inject `Database`. Start transactions for `store`, `destroy`, and `assignToTodo`. In `assignToTodo`, use `TodosTable`, `TagsTable`, and `TodoTagsTable` bound to the same `tx`; validate the todo and selected tags before replacing junction rows and touching the todo.

- [ ] **Step 4: Simplify module composition and remove the model**

Construct `new TagController(db)` in `TagModule.create()`. Delete `TagModel` and its imports.

- [ ] **Step 5: Run the tag suite**

Run: `npm run test:integration -- src/modules/tag/tag.controller.test.ts --test-reporter=dot`

Expected: all tag controller tests pass unchanged.

### Task 5: Verify The Standardized Pattern

**Files:**
- Verify: `src/tables/*.table.ts`
- Verify: `src/modules/project/project.controller.ts`
- Verify: `src/modules/tag/tag.controller.ts`
- Verify: `src/modules/todo/todo.controller.ts`
- Verify: `AGENTS.md`
- Verify: `docs/agent-instructions/architecture.md`

**Interfaces:**
- Produces: complete controller Transaction Script and plural table gateway convention.

- [ ] **Step 1: Scan architectural invariants**

Run: `rg 'db\.transaction|\.transaction\(' src/tables -n`

Expected: no matches.

Run: `rg 'ProjectModel|TagModel|TodoModel' src -n`

Expected: no matches.

- [ ] **Step 2: Run all integration tests**

Run: `npm run test:integration -- --test-reporter=dot`

Expected: exit 0 with no failures.

- [ ] **Step 3: Run static verification**

Run: `npm run typecheck`

Expected: exit 0.

Run: `npx biome check src/tables src/modules docs/agent-instructions/architecture.md AGENTS.md`

Expected: exit 0 with no errors.

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 4: Run end-to-end tests**

Run: `npm run test:e2e -- --workers=1 --reporter=line`

Expected: all browser tests pass.

- [ ] **Step 5: Leave changes uncommitted for review**

Run: `git status --short`

Expected: implementation files remain unstaged and no commit is created.
