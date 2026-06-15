# Testing Guidelines

## Overview

Test observable behavior. Prefer a small number of integration-style tests over many brittle unit tests.

## Rules

* Use `node --test`.
* Test public behavior as black-box behavior.
* Prefer real dependencies.
* Keep tests colocated with the module they cover.
* DB-backed tests must isolate their state and clean up after themselves.
* If a layer no longer exists, its tests should be removed or folded into higher-level tests.
* Do not write unit tests for controller internals, temporary helper functions, or code that is likely to be refactored soon.
* Test behavior, not structure.

Good default test targets:

* HTTP behavior for controller-driven modules
* DB-visible outcomes for persistence-heavy flows
* small pure tests only where logic is genuinely easier to verify in isolation
