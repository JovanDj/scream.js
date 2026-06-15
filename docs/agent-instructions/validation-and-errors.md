# Validation and Error Guidelines

## Overview

Request values stay raw until validation. Boundary parsing turns untrusted input into trusted values, and invalid user input is normal control flow.

## Boundary Input

* Route params are decoded strings.
* Query params are decoded strings or string arrays.
* Form body values are decoded but not magically typed.
* JSON bodies still require validation.
* Treat all external input as raw and untrusted.
* Raw boundary data must be parsed into trusted values before use.
* Never let inner layers inspect or depend on raw boundary data.
* Boundary adapters own where data comes from.
* Feature modules own what valid data looks like for their use cases.
* Shared code may provide generic validator primitives and combinators only.
* Shared code must not own feature-specific contracts.

`HttpContext` should provide boundary validation helpers:

* `context.param(...)`
* `context.query(...)`
* `context.body(...)`

Actual schemas and validators remain explicit and reusable.

## Validation Result

Applying a validator must return either a trusted parsed value or structured errors.

Validation returns a discriminated union, not exceptions:

```ts
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: FormErrors };
```

Do not use boolean validation checks that leave raw data in circulation.

Invalid user input is normal control flow, not exceptional framework failure.

## Form Errors

Validation errors, business-rule errors, and database conflicts render through one form-error contract.

`FormErrors` is a small first-class object. It supports:

* field errors
* form/global errors
* `field("email")`
* `has("email")`
* `any()`

Errors are keyed by stable field paths:

```ts
{
  fields: {
    "user.email": ["Email must be valid"],
    "items.0.name": ["Name is required"],
  },
  form: ["Invalid submission"],
}
```

Cross-field validation is required through simple object-level refinement. Async/database-backed validation is not part of the schema system. Do those checks after parsing, with DB constraints as the final guard.
