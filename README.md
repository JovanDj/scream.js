# ScreamJS

ScreamJS is an experimental full-stack TypeScript framework for server-rendered HTML applications.

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
