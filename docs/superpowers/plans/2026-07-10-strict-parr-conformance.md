# Strict Parr Conformance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Parr's strict model-view boundary through composed templates, pushed contexts, HTTP adapters, and the sample application's MVC structure.

**Architecture:** Validate inert contexts before evaluation, analyze renderer placement on the final composed AST, and keep HTML generation in templates and `HtmlRenderer`. Inject the engine through each HTTP adapter and move database operations into direct module model classes.

**Tech Stack:** TypeScript, Node test runner, ScreamTemplateEngine, Express, Koa, Knex, Biome.

## Global Constraints

- Write black-box failing tests before production changes.
- Remove `SafeHtml` and `HtmlAttributes`; preserve `FormattedDate`, `FormattedNumber`, and internal chained-template values.
- Keep expressions path-only and URLs controller-owned.
- Preserve unrelated changes and the untracked `output/` directory.
- Do not commit; leave all changes for user review.

---

### Task 1: Inert Render Contexts

**Files:**
- Modify: `lib/template-engine/template-engine.test.ts`
- Modify: `lib/template-engine/template-engine.ts`
- Modify: `lib/template-engine/evaluator.ts`

**Interfaces:**
- `render(template: string, context: RenderContext): string`
- `renderView(viewName: string, context: RenderContext): string`
- Both methods reject accessors and proxies without invoking them.

- [ ] Add black-box tests using getter counters and `Proxy` trap counters at top-level and nested paths through both render methods.
- [ ] Run the focused suite and confirm top-level getters and proxies fail because their counters become `1` or rendering succeeds.
- [ ] Pass contexts directly instead of spreading them. Use `isProxy` from `node:util/types` before descriptor inspection and throw `RenderError("Cannot access proxy value", { expression })`.
- [ ] Run the focused suite and confirm every counter remains `0` and each render throws the expected `RenderError`.

### Task 2: Composition-Safe Renderer Placement

**Files:**
- Modify: `lib/template-engine/template-engine.test.ts`
- Modify: `lib/template-engine/template-compiler.ts`

**Interfaces:**
- Compilation rejects divergent HTML contexts with `TemplateSyntaxError("Template composition must preserve HTML context")`.
- Final layout variables expose `renderPosition: "attributeValue"` to custom renderers.

- [ ] Add black-box tests for a child block in a quoted attribute, a child block in script/style, a conditional that opens raw text or a quote around a variable, and anonymous/named/file-backed apply bodies that leave their initial HTML context.
- [ ] Run the focused suite and confirm the current compiler either renders unsafe output or reports the wrong render position.
- [ ] Resolve includes and layout inheritance before final renderer placement and URL validation. Clear stale `renderPosition` when a final variable is in body text.
- [ ] Make block and scope nodes propagate child state. Require conditional branches to finish in equal states. Require every possible apply body/reference to finish in its starting state.
- [ ] Run the focused suite and all existing conditional-attribute, recursion, include, layout, round-robin, and chaining tests.

### Task 3: Remove Presentation Escape Values

**Files:**
- Modify: `lib/template-engine/template-engine.test.ts`
- Modify: `lib/template-engine/render-values.ts`
- Modify: `lib/template-engine/html-renderer.ts`
- Modify: `lib/template-engine/template-engine.ts`

**Interfaces:**
- Remove exports and classes `SafeHtml`, `HtmlAttributes`, `HtmlAttributeValue`, and `HtmlAttributeEntry`.
- Keep `FormattedDate`, `FormattedNumber`, and internal `RenderedTemplateValue`.

- [ ] Replace trusted-HTML and prepared-attribute tests with a dynamic module-export assertion and black-box tests proving ordinary HTML strings escape and renderer objects fail as ordinary objects.
- [ ] Run the focused suite and confirm the removed-export assertion fails.
- [ ] Delete the public values and their renderer branches. Keep quoted scalar escaping and presence-gated literal attributes.
- [ ] Run the focused suite and typecheck; update all static imports so no removed symbol remains.

### Task 4: Inject Template Engines Through HTTP Adapters

**Files:**
- Create: `lib/http/template-engine-injection.test.ts`
- Modify: `lib/http/express/express-application.ts`
- Modify: `lib/http/koa/koa-application.ts`
- Modify: `lib/http/scream/scream-application.ts`
- Modify: `lib/http/scream/scream-http-context.ts`

**Interfaces:**
- `ExpressApp.create(templateEngine?: ScreamTemplateEngine): Application`
- `KoaApp.create(templateEngine?: ScreamTemplateEngine): Application`
- `new ScreamApp(templateEngine?: ScreamTemplateEngine)`
- `new ScreamHttpContext(req, res, templateEngine)`

- [ ] Add one black-box HTTP test per adapter. Build an engine with `InMemoryFileLoader`, mount a route that calls `ctx.render()`, make a real request, and assert the injected template output.
- [ ] Run the new test and confirm signatures or rendered output fail.
- [ ] Store and pass the injected engine while retaining default construction for existing callers.
- [ ] Replace adapter context object spreads with descriptor-safe local merging that rejects top-level accessors/proxies before reading them.
- [ ] Run the new tests and existing HTTP/controller integration tests.

### Task 5: Restore MVC And View Encapsulation

**Files:**
- Create: `src/modules/todo/todo.model.ts`
- Create: `src/modules/tag/tag.model.ts`
- Create: `src/modules/project/project.model.ts`
- Modify: matching controllers, modules, controller tests, and `views/*.scream`

**Interfaces:**
- `TodoModel`, `TagModel`, and `ProjectModel` accept `Database` in their constructors.
- Controllers accept their model class, parse HTTP input, map model results to ViewModels, and choose responses.
- Model methods retain current query, transaction, not-found, and uniqueness behavior without returning HTML or route URLs.

- [ ] Run the existing todo, tag, and project controller suites as characterization tests.
- [ ] Move each database query and transaction unchanged into the matching model class; wire models in module factories.
- [ ] Add a `title` block to `layout.scream` and every child view. Move fixed page titles, headings, and submit labels into view literals; interpolate only pushed domain values for dynamic titles.
- [ ] Remove obsolete `pageTitle` and `submitLabel` locals while retaining complete route and asset URLs.
- [ ] Run each controller suite after its module migration, then run all three together.

### Task 6: Documentation And Full Verification

**Files:**
- Modify: `docs/agent-instructions/template-engine.md`
- Modify: `docs/agent-instructions/architecture.md`
- Modify: `AGENTS.md`

- [ ] Remove `SafeHtml`/`HtmlAttributes` guidance. Document inert plain ViewModels, proxy/accessor rejection, composition-safe HTML contexts, injected engines, controller/model responsibilities, and entanglement index 1.
- [ ] Run `rg 'SafeHtml|HtmlAttributes' lib src views docs AGENTS.md` and confirm no public guidance or implementation remains.
- [ ] Run `npm run test:integration -- lib/template-engine/template-engine.test.ts --test-reporter=dot`.
- [ ] Run `npm run test:integration -- --test-reporter=dot` and `npm run test:e2e -- --workers=1 --reporter=line`.
- [ ] Run `npm run typecheck`, `npx biome check lib/template-engine lib/http src/modules views docs/agent-instructions AGENTS.md`, and `git diff --check`.
- [ ] Review `git status --short` and leave all implementation and design files uncommitted.
