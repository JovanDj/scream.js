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
   -> layout inheritance resolution
-> TemplateRenderer
-> HTML
```

Stage responsibilities:

| Stage | Responsibility |
| --- | --- |
| FileLoader | Load named template source |
| TemplateCompiler | Coordinate tokenization, parsing, named parent view compilation, and layout inheritance resolution |
| Tokenizer | Turn source into tokens |
| Parser | Turn tokens into AST |
| TemplateRenderer | Render compiled AST with context into HTML |

Every stage receives structured input, returns structured output, and does not do another stage's job.

## Tokenization and Parsing

* The tokenizer is strictly lexical: it emits text, tag delimiters, identifiers, strings, number lexemes, and punctuation with source spans.
* All words, including `attr`, `if`, `for`, and `in`, are identifiers. Only the parser interprets directive names in directive position.
* Variable and directive tags use the same content scanner. Closing delimiters inside quoted strings do not end a tag.
* Both quote styles are supported; backslash escapes are not part of the string syntax. Static text is preserved exactly.
* Number tokens retain their original digits. The parser converts numeric literals and indexes and rejects values outside JavaScript's safe-integer range. Quoted numeric keys remain strings.
* The parser takes tokens only. It parses attribute names, assignments, paths, literals, and conditions without rescanning raw source.
* Attribute names must be contiguous and static; hyphens, colons, underscores, and numeric fragments are preserved. Spaced and dotted names are rejected.
* An attr condition begins at the last whitespace-delimited `if` outside strings, bracket paths, and dotted-property positions.
* Expressions must consume their complete token range. Operators and adjacent literals are rejected; operator characters inside a quoted string are ordinary text.

## Compilation and Rendering

* Layout inheritance is compile-time behavior.
* `TemplateCompiler` owns layout inheritance because the only AST transformation needed by the engine is static layout resolution.
* Introduce a separate transform pipeline only when multiple independent compile-time AST transforms exist.
* Named view loading belongs to `FileLoader`; it does not parse template grammar or merge layouts.
* Rendering is split into compile-time work (`TemplateCompiler`) and render-time work (`TemplateRenderer`).
* `ScreamTemplateEngine.create(fileLoader)` is the public composition path for wiring the default tokenizer, parser, evaluator, and generator.
* `renderView()` resolves source through `FileLoader` and reports named-view syntax or render failures with the relevant view name.
* Render contexts are strict: missing values, invalid direct object/array rendering, and invalid loop collections fail loudly.
* Template-engine coverage is intentionally black-box at the public `ScreamTemplateEngine` boundary.

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
* Includes are planned for the same static composition model.
* No dynamic includes.
* Includes will resolve from the configured views root.
* No `./` or `../` relative paths.
* Absolute paths and traversal outside views root are rejected.
* Explicit file extensions are required.
* `.scream` is the only template extension.
* Plain HTML is valid `.scream`.

## Expressions

* Variable output is HTML-escaped by default.
* No raw or unescaped output.
* No arbitrary JavaScript.
* No complex inline computation.
* No `Math`, `process`, globals, imports, or arbitrary object method calls.
* `csrfToken` is a value, not a helper function.
* Whitespace trimming syntax is excluded.
* Helper calls and template comments are planned, not current syntax.

Allowed expression examples:

```scream
{{ user.name }}
{{ todo.title }}
```
