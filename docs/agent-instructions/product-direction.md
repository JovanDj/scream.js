# Product Direction

## Overview

Scream.js is a full-stack TypeScript framework for SSR HTML applications. It is database-backed, CRUD-first, explicit, testable, and boring in the right way.

The core principle is speed of delivery inside architectural guardrails.

## Product Decisions

Scream.js rejects:

* Express-style chaos
* NestJS-style ceremony
* Next.js frontend gravity
* Laravel/Rails-style dynamic magic
* decorators, reflection, metadata, runtime scanning, and hidden object assembly

Framework defaults:

* fat controllers are acceptable
* services are optional
* repositories are optional
* gateways are optional
* ORMs are not required or provided by default
* query files are not created by default
* dependency containers are not used
* hidden magic is not allowed

## Refactor Pressure

Refactor only when real pressure appears:

| Pressure | Refactor toward |
| --- | --- |
| Controller becomes hard to read | service/use case |
| SQL repetition appears | persistence abstraction |
| Business rules grow | domain/table object |
| Repeated rendering behavior appears | base/helper |
| Validation gets large | module-local validator/schema |

## Current Priorities

1. Keep the scope focused on SSR HTML CRUD.
2. Design resource routing: action interfaces, `resource()` registration, and generated route names.
3. Build route generation: `route(name, params)` with the route-generation rules.
4. Add method spoofing: POST plus `_method`.
5. Add CSRF middleware and expose `csrfToken` automatically to views.
6. Define `FormErrors` as one renderable error contract.
7. Define validation results as a discriminated union.
8. Keep template layout inheritance as compiler-owned static composition.
9. Restrict template syntax to static composition, escaped output, and simple expressions.
10. Prove everything with one boring CRUD app.

## Goal

Build the simplest system that works well as soon as possible.

Prefer:

* direct code over layered indirection
* fewer files over textbook separation
* real behavior over architectural purity
* local clarity over abstract reuse

Avoid introducing structure unless it clearly pays for itself now.
