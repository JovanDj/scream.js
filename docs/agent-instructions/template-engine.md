# Template Engine Guidelines

## Overview

The template engine is a first-class core framework component behind a small rendering contract.

## Pipeline

The template pipeline is:

```text
template source/name
-> FileLoader for named views
-> TemplateCompiler
   -> tokenizer
   -> parser
   -> static template reference resolution
   -> layout inheritance resolution
-> TemplateRenderer
   -> Evaluator
   -> HtmlRenderer
-> HTML
```

Stage responsibilities:

| Stage | Responsibility |
| --- | --- |
| FileLoader | Load named template source |
| TemplateCompiler | Coordinate tokenization, parsing, static template reference resolution, named parent view compilation, and layout inheritance resolution |
| Tokenizer | Turn source into tokens |
| Parser | Turn tokens into AST |
| Evaluator | Resolve paths, presence checks, template applications, and blocks into render nodes |
| HtmlRenderer | Convert render nodes and raw values into escaped HTML |
| TemplateRenderer | Coordinate evaluation and HTML rendering |

Every stage receives structured input, returns structured output, and does not do another stage's job.

## Compilation and Rendering

* Static includes, file-backed applied templates, and layout inheritance are compile-time behavior.
* `TemplateCompiler` owns static template composition, including template-reference inlining and layout block merging.
* Introduce a separate transform pipeline only when compile-time behavior grows beyond static template composition.
* Named view loading belongs to `FileLoader`; it does not parse template grammar or merge layouts.
* Rendering is split into compile-time work (`TemplateCompiler`) and render-time work (`TemplateRenderer`).
* `ScreamTemplateEngine.create(fileLoader)` is the public composition path for wiring the default tokenizer, parser, evaluator, and HTML renderer.
* `renderView()` resolves source through `FileLoader` and reports named-view syntax or render failures with the relevant view name.
* Missing attributes render as empty strings for variable output.
* Invalid direct object/array/function/symbol rendering fails loudly.
* Template-engine coverage is intentionally black-box at the public `ScreamTemplateEngine` boundary.

## Model-View Separation

Templates follow Parr's strict model-view separation.

* Templates may reference attributes, test attribute presence, include static templates, and apply templates to attributes.
* Templates must not perform business logic, arbitrary computation, JavaScript truthiness checks, method calls, filters, or collection length checks.
* Templates must not hard-code URL values or URL fragments in URL-bearing attributes.
* Controllers and model code prepare all presentation state explicitly.
* Controllers provide complete route and asset URLs as attributes, including row-level URLs used inside template application.
* Applied item templates receive only the item ViewModel as `attr`; they do not inherit outer template context.
* Dynamic attribute values must be quoted, such as `class="{{ attr.className }}"`.
* URL-bearing attributes must use exactly one complete quoted attribute reference such as `href="{{ attr.showUrl }}"` or `src="{{ assetUrls.mainScript }}"`.
* URL-bearing attributes include `href`, `action`, `src`, `srcset`, `formaction`, `poster`, `cite`, and `manifest`.
* Do not compose URLs from literals and variables.
* To hide a conditional branch, omit the attribute or set it to `undefined` or `null`.
* Do not pass `false`, `0`, or an empty string to mean absent. Those values are present.
* Conditional attributes are written as conditional literal output, not as a special directive.

Example:

```scream
<option value="open"{% if fields.isOpen %} selected{% endif %}>Open</option>
```

## Loading and Inheritance

* `{% extends %}` is static only.
* `{% extends %}` must be the first meaningful statement.
* A template may have zero or one direct parent.
* No conditional or dynamic extends.
* Child templates that extend layouts may contain only extends plus block definitions at top level.
* Parent block fallback content renders when not overridden.
* Unknown child block overrides fail loudly.
* Missing templates fail loudly.
* Layout cycles fail loudly and report the cycle path.
* `{% include "partial.scream" %}` is static only and resolved at compile time.
* Included templates are inlined before rendering.
* Included templates may contain text, attribute references, presence checks, template definitions, template application, and nested includes.
* Included templates may not contain `{% extends %}` or `{% block %}` directives.
* `{% apply items to "row.scream" %}` is static only and resolved at compile time.
* File-backed applied templates follow the same path and shape rules as includes.
* No dynamic includes.
* Includes resolve from the configured views root.
* No `./` or `../` relative paths.
* Absolute paths and traversal outside views root are rejected.
* Explicit file extensions are required.
* `.scream` is the only template extension.
* Plain HTML is valid `.scream`.

## Expressions

* Variable output is HTML-escaped by default.
* Missing variable references render as an empty string.
* Paths are dot-separated attribute names only.
* No raw or unescaped output.
* No arbitrary JavaScript.
* No complex inline computation.
* No bracket/index access.
* No array length checks.
* No expression literals.
* No `Math`, `process`, globals, imports, or arbitrary object method calls.
* `csrfToken` is a value, not a helper function.
* Whitespace trimming syntax is excluded.
* Helper calls and template comments are planned, not current syntax.

Renderer-level values:

* `SafeHtml.fromTrustedHtml(html)` renders trusted HTML without escaping.
* Only sanitized or framework-generated HTML may be wrapped as `SafeHtml`.
* `HtmlAttributes.fromRecord(...)` exists as a future prepared-attributes value object.
* `HtmlAttributes` is not directly renderable yet; `{{ attrs }}` fails loudly.

Allowed expression examples:

```scream
{{ user.name }}
{{ todo.title }}
```

Disallowed expression examples:

```scream
{{ errors.title[0] }}
{{ user.name() }}
{{ price * quantity }}
<div class={{ state }}>
<div class=item-{{ state }}>
{% if todos.length %}
{% if count > 0 %}
{% if role == "admin" %}
```

## Conditionals

`{% if attribute.path %}` is a presence check.

* Present means the path resolves to a value that is not `null` and not `undefined`.
* Missing paths select the `{% else %}` branch when one exists.
* `false`, `0`, and `""` are present values.
* Conditionals must not compare values or compute predicates inside the template.

Example:

```scream
{% if errors.title %}
<div class="invalid-feedback">{{ errors.title }}</div>
{% else %}
<input name="title">
{% endif %}
```

## Template Application

Use template application instead of explicit loops.

Anonymous application:

```scream
{% apply todos %}
<a href="{{ attr.showUrl }}">{{ attr.title }}</a>
{% endapply %}
```

Named application:

```scream
{% template todoRow %}
<a href="{{ attr.showUrl }}">{{ attr.title }}</a>
{% endtemplate %}

{% apply todos to todoRow %}
```

File-backed application:

```scream
{% apply todos to "todo-row.scream" %}
```

Static include:

```scream
{% include "todo-list.scream" %}
```

Application rules:

* Applying an absent, `null`, or `undefined` attribute renders nothing.
* Applying an array renders once per item.
* Applying a single value renders once.
* The applied value is available as `attr` inside the applied template.
* Applied templates cannot read outer context; push every row value onto each item.
* Named templates render only when applied.
* Duplicate template names and unknown named applications fail loudly.
* Include/apply parameters are not current syntax.
* Round-robin application is not current syntax.

## Push-Only ViewModel Contract

Controllers push a complete ViewModel into templates. Templates never pull data from models, services, methods, globals, or computed expressions.

* Top-level templates may read only pushed top-level attributes.
* Applied templates may read only `attr` and paths below it.
* Controllers must prepare URLs, labels, booleans, selected-state markers, and form display values before rendering.
* Controllers may pass `SafeHtml` only for trusted HTML that has already been sanitized or generated by framework code.
* `HtmlAttributes` and prepared `FormView` objects are planned for future renderer-level use, but templates cannot render them directly yet.

Unsupported old syntax:

```scream
{% for todo in todos %}
{% attr selected if fields.isOpen %}
<a href="/todos/{{ attr.id }}">
<form action="/todos">
<a href="{{ todosUrl }}/{{ attr.id }}">
<script src="http://127.0.0.1:5173/main.ts"></script>
```

## Tokenizer and Parser Boundary

The tokenizer recognizes lexical shapes only. Directive names such as `if`, `apply`, `template`, `include`, and `endtemplate` are word tokens. The parser gives those words grammar meaning only in directive position.
