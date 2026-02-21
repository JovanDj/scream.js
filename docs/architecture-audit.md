# Abstraction Audit (`src/modules/**`)

Date: 2026-02-21
Scope: `src/modules/project/*.ts`, `src/modules/todo/*.ts`, `src/modules/tag/*.ts` (production files only, tests excluded)
Rule Basis: AGENTS `12.1) No Premature or Speculative Abstraction`

## High

None found.

## Medium

1. `src/modules/project/index.ts`
Decision: Keep
Reason: `createProjectModule` is a composition seam used by app bootstrap boundary (`server.ts`).
Evidence: framework/app wiring boundary; module API entrypoint.
Action: Added short in-file comment for single-use justification.

2. `src/modules/todo/index.ts`
Decision: Keep
Reason: `createTodoModule` is a composition seam used by app bootstrap boundary (`server.ts`) and test app setup.
Evidence: module entrypoint role and wiring isolation.
Action: Added short in-file comment for single-use justification.

3. `src/modules/tag/index.ts`
Decision: Keep
Reason: `createTagModule` is a composition seam used by app bootstrap boundary (`server.ts`).
Evidence: module entrypoint role and wiring isolation.
Action: Added short in-file comment for single-use justification.

## Low

1. `src/modules/tag/tag.controller.ts`
Decision: Keep
Candidate: `parseTagIds`
Reason: single-use helper that isolates `z.preprocess` normalization logic; keeps controller body parsing branch readable.
Action: Added short in-file comment for single-use justification.

2. `src/modules/todo/todo.controller.ts`
Decision: Keep
Candidate: `#renderIndexForScope`
Reason: reused by 5 scope endpoints (`index`, `open`, `completed`, `dueToday`, `overdue`); not speculative.
Evidence: concrete duplication removal across multiple call sites.
Action: No change required.

3. `src/modules/project/project.controller.ts`
Decision: Keep current state
Reason: previous `renderCreate`/`renderEdit` wrappers were already inlined; no remaining speculative render wrapper.
Action: No change required.

## Defer

None.
