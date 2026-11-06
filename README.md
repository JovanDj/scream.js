# ScreamJS

ScreamJS is an experimental full-stack TypeScript framework for server-rendered HTML applications.

Development targets Node 26 with strict TypeScript and Biome.

It is built around a narrow idea: CRUD apps should be fast to ship, easy to understand, and explicit about where work happens. The framework focuses on database-backed SSR HTML, plain forms, templates, routing, validation, and the everyday flow of small web applications.

> ScreamJS is not production-ready. It is actively developed for testing, learning, and framework design exploration. Public APIs and behavior may change.

## What It Is

ScreamJS is for applications that want:

* server-rendered HTML instead of a frontend-heavy app shell
* CRUD-first workflows
* boring database-backed behavior
* explicit boundaries over hidden magic
* forms, routes, templates, and validation as core framework concerns
* a modular monolith shape that can stay simple until real complexity appears

The goal is not to be the biggest framework. The goal is to make the common path for SSR CRUD applications clear, direct, and hard to accidentally overcomplicate.

## What It Avoids

ScreamJS intentionally avoids:

* Express-style unstructured applications
* NestJS-style ceremony
* Next.js-style frontend gravity
* Laravel/Rails-style dynamic magic
* decorators, reflection, runtime scanning, and hidden dependency containers
* premature layers that exist only because a framework usually has them

The project favors visible composition, plain control flow, and code that can start small without closing off later refactoring.

## Current Direction

ScreamJS is being shaped through a small, practical CRUD application. Features are added when they help that kind of app stay explicit, testable, and easy to change.

The core question behind the project is:

> How small and direct can a full-stack TypeScript SSR framework be while still giving teams useful architectural guardrails?

## Status

ScreamJS is early-stage framework work. It is best read as a prototype, learning project, and design exploration for explicit SSR HTML applications.

## Architecture and Development

### Application Skins

The reference application includes default and compact skins. Choose one when
starting the server; it applies to everyone until the server restarts.

```powershell
npm run dev          # Default presentation, with Vite assets
npm run dev:compact  # Compact presentation, with Vite assets
```

For server-only startup, use `npm run start` or `npm run start:compact` with Vite
already running. Alternatively, set `SCREAM_SKIN` to `default` or `compact`.
An unset value selects `default`; empty or unknown values refuse startup.

Views are grouped under `views/default/` and `views/compact/`. The compact skin
overrides only the layout and Todo list. Other pages and shared partials fall back
to `views/default/`, without changing controllers, Services,
or ViewModels. Compact styles are scoped so the default skin is unchanged.

The reference application groups features by workflow and uses explicitly composed Controllers and caller-independent Services. Framework controller lifecycles live in `lib/http/controllers`; application modules retain their public APIs and `mount(app)` registration.

See [agent instructions](AGENTS.md) and [architecture guidance](docs/agent-instructions/architecture.md) for contributor conventions.
