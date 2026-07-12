# Strict Parr Conformance Design

## Goal

Make ScreamJS enforce Parr's model-view separation rules through every public rendering path. Break incompatible APIs instead of preserving presentation escape hatches. Keep templates limited to pushed path values, presence checks, static composition, and template application.

## Rendering Boundary

`ScreamTemplateEngine` must consume inert pushed data. It must reject accessors and proxies before either can execute. Public render methods must not clone or merge contexts with object spread. HTTP adapters must use the same safe context merge when they combine framework defaults, adapter state, and controller locals.

Path resolution accepts own data properties only. It rejects arrays during path traversal, accessor descriptors, proxies, functions, and unsupported renderer values. Arrays remain valid apply sources. Missing properties keep their current empty-output and absence semantics.

Remove `SafeHtml`, `HtmlAttributes`, `HtmlAttributeValue`, and `HtmlAttributeEntry` from the public API and renderer. The HTML renderer continues to escape scalar values, render internal chained-template values, and format `FormattedDate` and `FormattedNumber`. Templates express attributes with literal markup, quoted scalar interpolation, and presence-gated literal output.

## Compiler Safety

Renderer-position and URL analysis must inspect the final AST after includes and layout inheritance are resolved. Reanalysis must replace stale position metadata from intermediate compilation.

Composition must preserve HTML context:

- A block or isolated scope propagates the context produced by its children.
- Both conditional branches must finish in the same context; otherwise compilation fails.
- Every anonymous, named, file-backed, round-robin, and chained applied template must finish in its starting context because it may render zero or many times.
- Variables remain forbidden in raw script/style bodies and unquoted attribute values.
- Variables in quoted attributes use attribute-value escaping.
- URL-bearing attributes still require one complete quoted path reference.

These rules reject markup that opens an attribute, element, script, or style context in one conditional, block, or applied template and closes it elsewhere.

## Framework And MVC Composition

`ExpressApp.create()` and `KoaApp.create()` accept an optional `ScreamTemplateEngine`, defaulting to the standard engine. `ScreamApp` accepts the same dependency in its constructor and passes it to each `ScreamHttpContext`. This makes template groups, skins, and custom renderers available through normal `ctx.render()` calls without a second configuration abstraction.

Add one direct model class to each database-backed module: `TodoModel`, `TagModel`, and `ProjectModel`. Each class owns its module's queries, transactions, and state transitions. Controllers parse HTTP input, call model methods, map returned data into ViewModels, and choose the response. Modules construct each model and inject it into its controller. Existing controller integration tests remain the behavioral contract; no tests target model internals.

Move fixed presentation strings from controllers into templates. Each page overrides a static layout title block; pages with dynamic titles interpolate pushed domain values inside that block. Fixed headings and submit labels become template literals. Controllers continue to push complete route and asset URLs because Parr assigns URL structure to the controller.

## Tests

Write and run failing black-box tests before production changes:

- Child layout block variables receive quoted-attribute placement through the public custom-renderer boundary and remain forbidden in script/style bodies.
- Conditional branches cannot split HTML contexts around variables.
- Applied templates cannot change their caller's HTML context.
- Top-level and nested accessors are rejected without invocation through `render()` and `renderView()`.
- Top-level and nested proxies are rejected without invoking traps.
- The public template-engine module no longer exports `SafeHtml` or `HtmlAttributes`.
- Ordinary strings remain escaped and conditional literal attributes still work.
- Each HTTP adapter renders through an injected engine; group/skin selection works through controller rendering.
- Existing controller tests continue to pass after model extraction and view migration.

Run the focused template suite after each red-green cycle, then run full integration, typecheck, Biome, `git diff --check`, and e2e because application templates and HTTP composition change.

## Documentation And Compatibility

Update the template guide and `AGENTS.md` to remove trusted HTML and prepared attribute guidance. Document inert plain ViewModels, proxy/accessor rejection, composition-safe HTML contexts, HTTP engine injection, and entanglement index 1. Note that detecting arbitrary display meaning in otherwise plain values remains undecidable.

This change intentionally breaks imports and callers of `SafeHtml` and `HtmlAttributes`, controller constructors that accepted `Database` directly, and any template that splits HTML syntax across composition boundaries.
