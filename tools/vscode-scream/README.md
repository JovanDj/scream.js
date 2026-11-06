# Scream Syntax (Local)

Syntax highlighting for this repository's `.scream` templates. HTML uses VS Code's
built-in grammar; Scream expressions and directives use the active theme's colors.
Format Document uses Microsoft's HTML language service, the same formatting engine
as VS Code's built-in HTML extension. A small Scream-aware pass formats template
tags and supplies their nesting to the HTML formatter. Normal HTML files keep
their existing formatter. There is no autocomplete or validation.

## Format

After installing the extension, use **Format Document** (`Shift+Alt+F` on Windows)
in a `.scream` file. Workspace settings select this formatter for Scream only.
Editor tabs/spaces settings and HTML formatting settings (`html.format.*`) apply,
with these Scream-specific rules:

- Tag delimiters use one inner space: `{{ user.name }}` and `{% if user %}`.
- Paths and calls have no spaces around dots or parentheses. Parameter commas and
  colons are followed by one space. Quoted strings keep their original contents.
- Standalone `if`, `block`, `template`, and anonymous `apply` pairs indent their
  bodies. `else` and closing directives align with their opener.
- Named/file-backed `apply ... to ...` calls do not open an indentation level.
- Inline constructs remain inline. Mixed inline/standalone pairs do not add a
  structural indentation level. Conditional attributes stay together when wrapped.
- HTML attributes use `force-expand-multiline` in Scream files, overriding
  `html.format.wrapAttributes`. Other file types are unaffected.
- Content inside `pre`, `code`, and `textarea` is left unchanged by default.
  `html.format.contentUnformatted` controls this list.

Settings changes apply on the next format operation without rebuilding. To change
these fixed Scream rules, change the extension and rebuild the VSIX. No repository
templates are rewritten automatically.

## Package

From this directory:

```powershell
npm ci
npm exec --yes --package=@vscode/vsce -- vsce package --allow-missing-repository --skip-license
```

This creates `scream-syntax-0.0.4.vsix` locally, including its formatting
dependencies. It does not publish anything or change application dependencies.

## Enable Only For This Repository

1. In VS Code, run **Extensions: Install from VSIX** and select the generated VSIX.
2. Find **Scream Syntax (Local)** in Extensions and choose **Disable** globally.
3. With this repository open, choose **Enable (Workspace)** for the extension.
4. Reload VS Code if prompted. Open a `.scream` file; its language should be **Scream**.

The extension ID is `screamjs-local.scream-syntax`. Install a rebuilt VSIX after
changing the extension. **Developer: Inspect Editor Tokens and Scopes** can inspect
the highlighting without requiring particular theme colors.

## Verify

Run `npm run typecheck` after installing the repository's dependencies. To run the
formatting tests in VS Code with a separate temporary profile:

```powershell
code --disable-extensions --skip-welcome --skip-release-notes --disable-workspace-trust --user-data-dir="$env:TEMP/scream-vscode-format-tests/profile" --extensions-dir="$env:TEMP/scream-vscode-format-tests/extensions" --extensionDevelopmentPath="$PWD" --extensionTestsPath="$PWD/test/run.cjs"
```

The tests exercise the editor's formatting command, preserving form values and
Scream syntax while leaving normal HTML formatting available. They do not install
the extension into your normal profile.
