# HTTP and Routing Guidelines

## Overview

Scream.js is SSR form-first and CRUD-first. Routing should stay resource-based, explicit, and boring.

## Resource Routing

Default routing should be resource-based for SSR CRUD.

Canonical actions:

* `index`
* `create`
* `store`
* `show`
* `edit`
* `update`
* `destroy`

Use Laravel-style `create`/`store`, not Rails-style `new`/`create`. Use `destroy`, not `delete`.

Resource routing should use separate action interfaces, so users can pick actions individually. Full CRUD is a prebuilt composition of those action interfaces.

Default resource routes:

| HTTP | Path | Action |
| --- | --- | --- |
| GET | `/todos` | `index` |
| GET | `/todos/create` | `create` |
| POST | `/todos` | `store` |
| GET | `/todos/:id` | `show` |
| GET | `/todos/:id/edit` | `edit` |
| PATCH | `/todos/:id` | `update` |
| DELETE | `/todos/:id` | `destroy` |

Controllers use classic methods, not arrow-function fields. The router/resource system must support classic methods without making users fight JavaScript binding.

## Route Names and URL Generation

`resource()` generates route names automatically. Do not add explicit route-name overrides.

`routes.resource("/todos", todosController)` generates:

* `todos.index`
* `todos.create`
* `todos.store`
* `todos.show`
* `todos.edit`
* `todos.update`
* `todos.destroy`

Nested paths become dot-separated route namespaces. For example, `/admin/blog-posts` generates names such as `admin.blog-posts.index`.

Dynamic params are skipped in route names. For example, `/projects/:projectId/tasks` generates names such as `projects.tasks.index`.

`route()` rules:

* returns relative URLs only
* fills path params first
* leftover values become query params
* URL-encodes path and query values
* template engine handles HTML escaping
* fails loudly on missing route names or missing params
* omits `undefined`
* preserves empty strings
* rejects `null`
* rejects objects
* rejects `Date`
* supports arrays as repeated query keys
* serializes booleans as `true` and `false`

## Path Handling

* Registered routes normalize away trailing slash, except `/`.
* Route generation outputs canonical non-trailing-slash URLs.
* Request matching tolerates trailing slashes silently.
* No automatic redirect.
* Route matching is case-sensitive.
* Path params are decoded before controller access.
* Invalid percent encoding returns `400 Bad Request`.
* Params remain strings until explicit validation or coercion.

## HTML Forms

Method spoofing:

* enabled by default
* handled before route matching
* only reads POST body `_method`
* supports `PATCH` and `DELETE`
* is not handled in controllers

CSRF:

* part of the framework
* handled in the HTTP/app middleware pipeline
* applies to unsafe methods
* ignored for `GET`
* invalid token returns `403`
* token is automatically exposed to templates as `csrfToken`

Do not add a form-helper DSL. Plain HTML comes first.
