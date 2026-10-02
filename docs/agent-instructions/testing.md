# Testing Guidelines

## Overview

All tests must be black-box BDD. Describe a scenario, exercise a public boundary, and assert its observable outcome. Design every component so its public behavior can be tested with explicitly supplied dependencies. Prefer a small number of valuable behavior tests over many brittle implementation tests.

## Rules

* Use `node --test`.
* Test public behavior as black-box behavior.
* Apply this rule to application, framework, integration, browser, and package tests alike.
* Keep tests deterministic and their inputs immutable. Use fixed inputs and `const`; do not reassign behavior flags or use invocation counters to change test-double behavior. Real database writes remain observable outcomes, not mutable test-control state.
* Use separate immutable dependencies for failure and success scenarios instead of changing a dependency's behavior midway through a test. Do not claim same-instance recovery when the scenario requires replacing that instance.
* Control time, randomness, and external I/O explicitly when they affect the outcome. Do not rely on wall-clock values, sleeps, uncontrolled network responses, or unseeded randomness.
* Use behavior-oriented descriptions and Arrange/Act/Assert (Given/When/Then) structure. Naming a suite with `describe` does not by itself make it BDD.
* Choose the simplest public boundary that exposes the behavior: HTTP responses, CLI output and exit status, service return values and persisted state, or framework API results and errors.
* Do not inspect private state, invoke protected hooks, assert internal collaborator calls, or reproduce the implementation's algorithm in expected values.
* An internal refactor that preserves the public contract should not require changing test expectations.
* Black-box does not mean HTTP-only or browser-only. Direct tests of public service and framework APIs are valid; emitted SQL or package contents may be asserted when they are the public contract.
* Prefer real dependencies.
* Prefer classical state- and output-based tests over interaction-heavy mocking.
* Use test doubles only at meaningful boundaries where a real dependency would make the test slow, nondeterministic, or impractical.
* Do not mock internal collaborators merely to isolate every class.
* Unit-testability is a design property, not a requirement to create one isolated test per class.
* Keep tests colocated with the module they cover.
* DB-backed tests must isolate their state and clean up after themselves.
* Register resource cleanup with `t.after()` immediately after setup instead of wrapping test bodies in cleanup-only `try/finally`. Keep explicit close/shutdown operations in the test body when their behavior is under test.
* If a layer no longer exists, its tests should be removed or folded into higher-level tests.
* Do not write unit tests for controller internals, temporary helper functions, or code that is likely to be refactored soon.
* Do not test protected hooks directly or assert lifecycle call order when the final result proves the behavior.
* Reproduce a suspected defect with a failing test before changing production code. If it cannot be reproduced, do not change the code speculatively.
* Test behavior, not structure.
* Test each substantive extracted service directly through its public operation with supplied dependencies, without invoking a controller. Assert its result and observable state; keep HTTP tests for request parsing, responses, and wiring.

Good default test targets:

* HTTP behavior for controller-driven modules
* DB-visible outcomes for persistence-heavy flows
* shared controller lifecycles through their public `handle()` method when the shared behavior is substantial
* concrete controller filtering, sorting, rendering, and persistence through HTTP tests
* caller-independent services by invoking their public operation directly with explicit dependencies, without an HTTP controller or `HttpContext`
* small pure tests where logic is genuinely easier to verify in isolation

For database-backed services, use an isolated real database to assert returned values, committed changes, and rollback. Keep HTTP tests for controller response behavior; neither layer's tests replace the other when both have distinct behavior.

A recording `HttpContext` test implementation may replace an HTTP boundary in a focused controller test. It must record observable outcomes such as rendering, redirects, and not-found responses rather than exposing or asserting internal calls.
