# ScreamJS action/handler architecture: context, decisions, and goals

Recorded: 2026-09-28. Status: user-approved direction; implementation is incremental.

This is the design brief for `screamjs_cqrs_engineer` and its independent reviewers. It preserves why the convention exists, not just the class names. Read it alongside the agent definition and current repository instructions. It does not authorize changes outside an assigned task, and it does not claim that all application code already follows the target.

## 1. The problem we are trying to solve

ScreamJS is intended to make database-backed SSR applications understandable, maintainable, and explicit. The user wants a foundation that can accommodate more complex features without repeatedly reorganizing the entire application or entangling unrelated behavior. Translate that aspiration into localized changes, visible dependencies, clear transaction boundaries, and regression protection. Do not promise that an architecture eliminates future refactoring, concurrency problems, or all feature conflicts.

Two concerns must remain distinct. ScreamJS should standardize repeated HTTP action mechanics so every feature does not reinvent them. Applications should express their business operations without embedding those operations in HTTP objects. A readable action is not enough if invoking the same operation elsewhere requires constructing an HttpContext or copying its SQL and rules.

The goal is not to maximize abstraction, object counts, or resemblance to a textbook. It is to make a use case understandable on its own while preserving the small-framework character of ScreamJS.

## 2. How the conversation reached this decision

### From DI principles to use-case handlers

The discussion began with the user's observation that Mark Seemann's DI book develops a design toward something resembling command handlers. We explored that observation in ScreamJS terms: explicit dependencies, operations with focused responsibilities, and a common execution contract that permits reusable wrappers. This describes the origin of our discussion, not a verified chapter-by-chapter account of a particular book edition. Do not claim that DI inevitably produces CQRS or that Seemann prescribed this exact TypeScript design.

The earlier working shape was Controller -> Service -> Transaction Script / optional Active Record. The useful refinement was to make the service represent one application operation. The handler IS that application service, normally containing the transaction script. Handler -> Service -> Repository -> Active Record is not the new mandatory stack.

A broad service can give unrelated methods access to every injected dependency. A use-case handler makes the dependencies needed by that operation explicit. That benefit, plus transaction decoration, justifies the small shared handler contract here; an interface for every class does not.

### From repeated transactions to TransactionHandler

The user specifically liked moving transaction mechanics into a reusable handler wrapper. A write such as replacing a todo's tags should express its complete operation, not repeatedly implement begin/commit/rollback plumbing. The HTTP action should not have to manage the transaction either.

An initially incomplete example opened a transaction around an already-constructed handler that still held the normal database. Merely opening the transaction does not replace that dependency. We then made the real mechanism explicit: obtain tx, construct the inner handler with tx, execute it, and let the existing database adapter finish the transaction.

### From automatic scopes to manual factories

An early suggestion used a DI container and a temporary scope to replace Database with tx. The user explicitly corrected it: only manual DI. The accepted replacement was delayed construction through a factory wired at the composition root. There is no automatic scope, registry, ambient database, or hidden resolution step.

The user subsequently asked for an interface instead of the bare factory function and approved CommandHandlerFactory.create(tx), implemented by a named factory class. That is the selected project convention, not a claim that function factories are inherently bad. Its purpose is an explicit construction contract with room for the factory's own injected dependencies. It must not evolve into a service locator or a prescribed constructor signature for all handlers.

### Preserving the user's action specialization idea

The user repeatedly clarified that single-action controllers must remain standardized by action kind, particularly Index. We therefore rejected replacing them with generic CommandController and QueryController base classes. An Index action defines an HTTP workflow; a ListTodos handler defines an application read operation. These responsibilities complement each other.

Earlier examples used the name IndexController. The inspected implementation uses IndexAction and later added StoreAction, ShowAction, and DestroyAction. Preserve the useful concept and actual current API, not an obsolete example name. Unique workflows do not need inheritance merely for uniformity.

### Adapting to the actual refactor

The September 28 source review found that routes already connected directly to separate actions. A previously suggested resource controller that only delegated to those actions was no longer needed. The accepted extension preserves direct wiring, extracts application behavior underneath actions, and moves transaction wrapping to manual composition.

Finally, the user requested that the implementation agent understand this decision history and its goals. Treat this context as a guide for resolving new details, not as a transcript in which every earlier assistant suggestion remains approved.

## 3. The selected design and why each boundary exists

```text
Route -> specialized HTTP Action -> command/query handler -> application logic / DB

Transactional command:
Action -> TransactionHandler -> concrete handler created with tx -> DB transaction

Construction:
application entry point -> explicit module factory -> action / wrapper / handler factory
```

**Action specialization:** owns transport parsing, stable lifecycle ordering, invalid-input responses, presentation, URLs, templates, and response production. It standardizes real repeated mechanics while allowing resource-specific differences. Once migrated, it does not execute SQL or open transactions, including in error-rendering paths.

**Command handler:** owns one application operation, including its state-dependent checks and coordinated persistence. It receives explicit dependencies and knows nothing about HTTP or templates. Returning an identifier or result is allowed; this project does not impose strict void-only command methods.

**Query handler:** answers a read question and returns validated application data. It may use SQL directly rather than construct a domain object solely for display. Show and edit may share it when their data needs match. Sharing a database or suitable types is allowed; duplicate models are not an objective.

**TransactionHandler:** adds transaction semantics without knowing Todo, Tag, or Project behavior. It implements the same command contract as the object it wraps. It manages execution through the existing database adapter, not through newly invented transaction mechanics.

**CommandHandlerFactory:** solves runtime construction, because tx exists only after the transaction begins. It constructs the handler and any transaction-bound collaborators using that tx. Stable collaborators can be injected into the factory. It performs no queries, validation, business operation, or transaction management.

**Composition root and module factories:** make the chosen dependencies, wrappers, and lifetimes visible as ordinary code. Module factories are explicit helpers of application composition, not independent containers. A few lines of wiring are intentional architecture, not boilerplate to hide behind registration.

```ts
new TodosStoreAction(
    new TransactionHandler(db, new CreateTodoHandlerFactory()),
)
```

The `db` argument belongs to the transaction wrapper. The inner handler receives tx later from factory.create(tx); the factory must not quietly substitute the root db.

## 4. What CQRS means here, and what it does not mean

Here, CQRS-style is shorthand for separate command/query application operations and the option to shape reads differently from writes. Separate handler interfaces alone do not establish separate conceptual read/write models. The useful deliverable is a lightweight use-case boundary, not a claim to have implemented every aspect of CQRS.

No separate databases, event sourcing, eventual consistency, brokers, asynchronous dispatch, mediator, handler registry, or generic pipeline framework is required. Possible future CLI, queue, or MCP callers illustrate why HTTP independence is useful; they are not requests to build those adapters now.

The relation to Clean Architecture is independence from transport and explicit dependency direction. This migration does not require replacing the existing database contract with repositories or making all SQL portable. Direct SQL, an existing useful domain model, or Active Record can be used beneath a handler when justified; do not introduce or remove a persistence style merely to match a diagram.

## 5. Deep modules, simplicity, and deliberate trade-offs

The deep-module goal is to hide useful implementation complexity behind an understandable interface. A use case can conceal coordinated rules and writes from its caller; TransactionHandler can conceal transaction lifecycle mechanics. A one-method class is not automatically deep, and another forwarding layer does not make a module deeper.

This design deliberately accepts some extra named classes and wiring. In return it seeks independently understandable operations, explicit dependency/lifetime boundaries, reusable transaction behavior, and changes that do not force HTTP and persistence code to move together. The factory class is particularly justified by the late availability of tx and the user's explicit contract preference.

Keep application modules flat and their public exports small. A command/query may form a module's public application API when another module needs it; that is not a mandate to export every handler or factory. Do not split Todo, Tag, and Project ownership or redesign their tables as a side effect of this migration.

The prototype-first/Gall's-law direction and this convention are compatible: repeated concrete action workflows came first; narrow shared lifecycles and a reusable transaction wrapper now address demonstrated needs. Preserve their purpose without designing every possible workflow in advance. A static template-rendering action needs no fabricated application operation.

## 6. Why correctness and testability are part of the goal

The transaction wrapper should reduce inconsistent transaction plumbing, not move bugs out of sight. All participating writes and the reads governing them must use the supplied tx. A factory must not cache transaction-scoped objects. Handler results must finish required database work before the transaction completes; no response rendering, streaming work, or detached task belongs inside it.

The wrapper does not make network effects transactional, fix isolation anomalies, supply idempotency, or guarantee exactly-once execution. A failed operation that must undo writes must reject or throw; returning false is not a rollback signal. Preserve existing locking, constraints, and complete atomic units. In particular, tag replacement must not become several independently committed commands.

The user favors black-box tests of behavior that survive refactoring and green commits. Keep real HTTP/module/database tests as the migration safety net. A test proving that a mocked handler was called is not a substitute for proving that the expected data was committed or restored after failure. Independent DI and testing reviewers protect different aspects of the same goal; creating an agent definition is not evidence that those reviews ran.

## 7. Superseded suggestions and deferred ideas

| Earlier suggestion | Current decision and reason |
| --- | --- |
| DI container with transaction-scoped resolution | Rejected: construct explicitly through a factory after tx exists. |
| ctx.execute(command), a registry, or automatic dispatch | Not selected: call the injected handler; assembly stays visible. |
| Bare function factory or callable interface | Superseded by the approved named object factory with create(tx). |
| Generic CommandController / QueryController | Rejected: preserve specialized HTTP action lifecycles. |
| Resource controller forwarding every action | Unnecessary in the inspected refactor: keep direct route-to-action wiring. |
| Handler constructed with db before the transaction | Incorrect mechanism for this design: construct it with tx inside the callback. |
| Transactions universally automatic for every command | Too broad: the composed wrapper supplies the guarantee, not the command's name. |
| Transaction remains in StoreAction plus a new wrapper | Avoid duplicate ownership: remove the old transaction when migrating that slice. |
| Handlers plus mandatory service/repository/mapper layers | Not selected: each extra collaborator must earn its place. |
| Retries, nested propagation, outbox, after-commit API | Deferred: discuss only for a concrete separately assigned need. |

## 8. Applying the goals to new decisions

For each proposed change, identify the concrete problem, the smallest boundary that addresses it, and the behavior that proves the change worked. Prefer the solution that leaves a reader able to locate the HTTP policy, application operation, transaction owner, and construction site without following hidden lookups.

Do not mechanically rename persist() to execute() while leaving SQL in action error paths or a root-db collaborator inside the transactional graph. Equally, do not turn an empty page into a query class just to satisfy a diagram. Keep transport schemas and data-row schemas at their respective trust boundaries, and do not parse transformed DTOs a second time as raw rows.

Preserve pagination/lookahead, sort tie-breakers, full-list error rendering, missing-record behavior, form values, and existing error mappings when extracting code. These are user-visible behavior, not incidental structure. Flag existing defects separately rather than silently changing them during a refactor.

Start a migration explanation with the problem and the intended benefit, then show one concrete object graph. The user explicitly asked not to be overwhelmed while learning the transaction/factory mechanism. Explain the next necessary step without introducing a catalogue of optional patterns or repeating this entire history in every status update.

Success means local, testable changes with visible dependencies and preserved behavior, not the number of classes created. The approved constraints remain in force; when a genuinely new requirement conflicts with them, explain the trade-off to the parent/user rather than silently reopening or overriding a settled decision.

## 9. Provenance and reading boundaries

The decisions, corrections, and goals above are a synthesis of the user's ScreamJS architecture conversation on September 27-28, 2026, including the request to preserve its rationale in the agent. They are not attributed quotations from Seemann, Ousterhout, Khorikov, or another author. Older experiments with repositories, mappers, or different read/write arrangements are background, not permission to restore a superseded stack.

The repository reference for the latest-actions discussion was commit `4ff91ea35ce80e933e895e9dc5e1c1de83de4788`, with store extraction at `ed428896b086eb5ba44212bcb0c5bd7c85a072f3` and remaining CRUD-action extraction at `66fa4c4823a4dd1a6ecfe6482b9f4834568fa0a9`. This anchors the history only. Read the current checkout before implementing; file names, schemas, and migration status may change.

Primary background references, consulted on 2026-09-28:

- Mark Seemann, [Pure DI](https://blog.ploeh.dk/2014/06/10/pure-di/): DI does not require a container. This supports terminology, not every ScreamJS choice.
- Mark Seemann, [Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/): application object graphs are assembled at an application boundary.
- Martin Fowler, [CQRS](https://www.martinfowler.com/bliki/CQRS.html): distinct update/read models and their trade-offs. Do not equate handler names with the entire pattern.

Read the actual local architecture, routing, validation, testing, and code-style instructions for implementation details. Cite current source locations for findings. Do not invent book quotations, pages, test results, or historical approvals.
