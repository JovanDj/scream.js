# Testing Guidelines

## Overview

Design every component so its public behavior can be tested with explicitly supplied dependencies. Test observable behavior and prefer a small number of valuable integration-style tests over many brittle unit tests.

## Rules

* Use `node --test`.
* Test public behavior as black-box behavior.
* Prefer real dependencies.
* Prefer classical state- and output-based tests over interaction-heavy mocking.
* Use test doubles only at meaningful boundaries where a real dependency would make the test slow, nondeterministic, or impractical.
* Do not mock internal collaborators merely to isolate every class.
* Unit-testability is a design property, not a requirement to create one isolated test per class.
* Keep tests colocated with the module they cover.
* DB-backed tests must isolate their state and clean up after themselves.
* If a layer no longer exists, its tests should be removed or folded into higher-level tests.
* Do not write unit tests for controller internals, temporary helper functions, or code that is likely to be refactored soon.
* Do not test protected hooks directly or assert lifecycle call order when the final result proves the behavior.
* Reproduce a suspected defect with a failing test before changing production code. If it cannot be reproduced, do not change the code speculatively.
* Test behavior, not structure.

Good default test targets:

* HTTP behavior for controller-driven modules
* DB-visible outcomes for persistence-heavy flows
* shared action lifecycles through their public `handle()` method when the shared behavior is substantial
* concrete action filtering, sorting, rendering, and persistence through HTTP tests
* small pure tests where logic is genuinely easier to verify in isolation

A recording `HttpContext` test implementation may replace an HTTP boundary in a focused action test. It must record observable outcomes such as rendering, redirects, and not-found responses rather than exposing or asserting internal calls.
