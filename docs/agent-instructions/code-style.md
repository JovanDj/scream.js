# Code Style Guidelines

## Overview

Use straightforward code with explicit data flow. Refactor only when it makes the next change easier or the current code clearer.

## Rules

* Keep functions short enough to scan quickly.
* Prefer straightforward names and explicit data flow.
* Keep concrete application code simpler than the abstraction supporting it.
* Prefer one cohesive operation input over a long list of related primitive parameters.
* Prefer early returns for branching and guard clauses.
* Avoid trailing `else` blocks after a branch that already returns, throws, or continues.
* Keep dispatch branches ordered and explicit so the main path is easy to scan.
* Avoid `as` casts unless there is no cleaner practical option.
* Do not use compile-time casts to work around missing boundary types. Parse or narrow data into a concrete type instead.
* Keep comments rare and useful.
* Refactor only when it makes the next change easier or the current code clearer.

## Class Encapsulation

Production classes must own their action-specific behavior and configuration.

* Module scope should normally contain only imports, exports, and the exported class.
* Do not declare action-specific constants, lookup objects, functions, or types at module scope.
* Put fixed configuration and decision logic inside the class that owns it.
* Use ECMAScript `#private` fields and methods whenever behavior does not belong to a subclass contract.
* Use `protected` only for members that an abstract base class requires subclasses to implement or access.
* Do not use the TypeScript `private` keyword when an ECMAScript `#private` member works.
* Keep public APIs as small as practical; expose behavior through methods and getters rather than internal state.
* Do not use `Map` or `Set` unless the user explicitly allows it for the current change.
* Do not use `Record` or object lookup tables to replace short explicit decision logic.
* Prefer a clearly named `#private` method with `switch` or `if` branches.
* Do not add explicit type annotations when TypeScript can infer the type.
* Do not keep ignored parameters merely to satisfy a preferred signature; reshape the boundary when the parameter has no role.
* Before finishing, inspect every new module-scope declaration and move it into the owning class unless it is intentionally exported or shared by multiple classes.

The best design here is the one that keeps shipping speed high without making the next few changes painful.
