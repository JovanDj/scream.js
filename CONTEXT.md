# ScreamJS

ScreamJS is a small web application framework that provides HTTP routing, request handling, and server-side HTML view rendering.

## Language

**HTML template rendering**:
The process of turning an HTML template and trusted render context into an HTML string.
_Avoid_: Template compilation, compile

**RenderContext**:
The complete data and helper environment visible to a template while it renders.
_Avoid_: TemplateContext, ViewData

**HttpContext**:
The request and response interaction object used by HTTP handlers.
_Avoid_: RenderContext

**RenderHelpers**:
The framework-provided helper API exposed to templates through the RenderContext.
_Avoid_: HttpContext helpers, global template helpers

**Strict rendering**:
The rule that template references fail loudly when they point to missing values.
_Avoid_: Silent missing values, forgiving rendering

**Loop collection**:
An array value rendered by a template loop.
_Avoid_: Iterable, collection

**SafeHtml**:
An explicitly trusted HTML fragment allowed to render without escaping.
_Avoid_: Raw string, unescaped string

**Template inheritance**:
The rule that a child template renders inside a parent template by replacing named blocks.
_Avoid_: Include, partial

**Template block**:
A named replaceable region declared by a parent template.
_Avoid_: Slot, section

**View name**:
A logical template reference resolved under the configured views root.
_Avoid_: Filesystem path, absolute path

**Template expression**:
A small read-only expression used by templates to reference render context values or call render helpers.
_Avoid_: Template script, inline program

**RenderError**:
A template rendering failure that identifies the broken template reference and its location when available.
_Avoid_: Generic error

## Relationships

- **HTML template rendering** consumes an HTML template and **RenderContext**.
- **HTML template rendering** escapes rendered values by default.
- **Template inheritance** begins with an `extends` directive as the first meaningful directive in the child template.
- **Template inheritance** allows a child template to replace only **Template blocks** declared by its parent.
- A template may declare or override a **Template block** name only once.
- A **View name** may contain relative child segments but must not be absolute or traverse outside the views root.
- Framework-facing render APIs use **View names**; framework adapters may translate from host-specific file paths internally.
- **RenderContext** contains application view data at the top level and **RenderHelpers** under `$`.
- **RenderHelpers** may use framework state internally, but must not expose **HttpContext** to templates.
- Templates may call functions only through **RenderHelpers**.
- **Template expressions** support path lookup, truthiness checks, loop references, and **RenderHelpers** calls only.
- **HttpContext** may produce a **RenderContext**, but templates must not receive an **HttpContext**.
- **Strict rendering** applies to all template references, including output expressions, conditionals, and loops.
- **Strict rendering** reports a **RenderError** with view, location, and expression details when available.
- A **Loop collection** must be an array; an empty array renders no loop body.
- **SafeHtml** is the only acceptable future path for unescaped output.

## Example dialogue

> **Dev:** "Does the template engine compile templates or render them?"
> **Domain expert:** "It renders HTML; compilation would mean producing a reusable template representation."
>
> **Dev:** "Can templates access the HTTP context?"
> **Domain expert:** "No — templates receive a RenderContext with data and rendering helpers only."
>
> **Dev:** "Where do built-in template helpers live?"
> **Domain expert:** "Under `$` in the RenderContext, separate from application data."
>
> **Dev:** "What happens when a template references a value the controller did not provide?"
> **Domain expert:** "Rendering fails; blank output would hide a bug."
>
> **Dev:** "Does that also apply inside conditionals and loops?"
> **Domain expert:** "Yes — a missing path is still a template bug."
>
> **Dev:** "Can a loop render any iterable?"
> **Domain expert:** "No — loops render arrays only; anything else is a render error."
>
> **Dev:** "Can a template print raw HTML?"
> **Domain expert:** "Not by default; unescaped output needs an explicit SafeHtml value."
>
> **Dev:** "Can a child template put content before `extends`?"
> **Domain expert:** "No — `extends` must be the first meaningful directive."
>
> **Dev:** "What if a child overrides a block the parent does not declare?"
> **Domain expert:** "Rendering fails; unknown blocks usually mean a typo or stale layout contract."
>
> **Dev:** "Can a template declare the same block twice?"
> **Domain expert:** "No — duplicate block names are ambiguous and fail rendering."
>
> **Dev:** "Is an `extends` target a filesystem path?"
> **Domain expert:** "No — it is a View name resolved inside the configured views root."
>
> **Dev:** "Why does an Express adapter see file paths?"
> **Domain expert:** "That is an adapter detail; ScreamJS render APIs speak View names."
>
> **Dev:** "Can templates call functions from application data?"
> **Domain expert:** "No — function calls are limited to RenderHelpers under `$`."
>
> **Dev:** "Can templates contain business logic or arbitrary expressions?"
> **Domain expert:** "No — controllers prepare display-ready values; templates use small read-only expressions."
>
> **Dev:** "What does a strict rendering failure tell me?"
> **Domain expert:** "It tells you which template reference failed and where it happened."

## Flagged ambiguities

- "compile" was used for immediate HTML output; resolved: call this **HTML template rendering** unless a reusable compiled template is introduced.
- The template engine was described generically; resolved: it is HTML-specific because variables are HTML-escaped by default.
- "TemplateContext" was used for render-time values; resolved: use **RenderContext** because it includes both application data and framework helpers.
- Built-in template helpers could collide with application data; resolved: expose **RenderHelpers** under `$`.
- Missing variables and invalid direct values were rendered as empty strings; resolved: **Strict rendering** should fail loudly for output expressions, conditionals, and loops.
- Loops silently ignored missing or non-array values; resolved: a **Loop collection** must be an array.
- Raw HTML output is not supported now; resolved: future raw output must require **SafeHtml** rather than a plain string.
- `extends` could appear after other template content; resolved: **Template inheritance** requires `extends` as the first meaningful directive.
- Unknown child blocks were not clearly defined; resolved: a child may override only **Template blocks** declared by the parent.
- Duplicate block names were not clearly defined; resolved: a template may declare or override each **Template block** name only once.
- Template references were filesystem-shaped; resolved: use **View names** confined to the views root, using `.scream` templates.
- `filePath` appeared in the template engine API; resolved: file paths are adapter details, while framework-facing rendering uses **View names**.
- Top-level rendering and inheritance used separate file-loading paths; resolved: all template loading should go through the same **View name** resolver.
- RenderContext can contain functions; resolved: templates may call only **RenderHelpers** under `$`, not arbitrary application data functions.
- Template expressions could grow into a scripting language; resolved: keep **Template expressions** limited to path lookup, truthiness checks, loop references, and helper calls.
- Strict rendering needs actionable failures; resolved: rendering failures should use **RenderError** with view, location, and expression details when available.
