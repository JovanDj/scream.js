# Template Test Traceability to Parr

The source is Terence Parr, *Enforcing Strict Model-View Separation in Template Engines* (2004): [repository PDF](references/parr-2004-enforcing-strict-model-view-separation-in-template-engines.pdf).

Every case in [the public engine suite](../lib/template-engine/template-engine.test.ts) has native Node test tags. Test names and assertions remain the behavior specification; tags add references, not a claim of complete paper conformance.

## Classification

Each test has exactly one classification:

| Tag | Meaning |
| --- | --- |
| `parr-direct` | Tests a capability or restriction explicitly described in the paper. The paper need not prescribe ScreamJS syntax. |
| `parr-derived` | Tests an enforcement decision or combination motivated by the cited passage. It is not a verbatim paper requirement. |
| `scream-policy` | Tests a ScreamJS contract without an equivalent paper requirement. No paper-reference tag is attached. |

Classification is per existing test, not per assertion. A mixed test can cover a paper-supported idea while its exact syntax, formatting, or diagnostics remain ScreamJS choices. These tags are a traceability aid, not a compliance score.

## Paper References

Page numbers below distinguish printed proceedings pages from the PDF viewer's one-based pages.

| Reference tag | Passage | Printed page / PDF page |
| --- | --- | --- |
| `parr-s3` | Section 3: independent template maintenance | 225-226 / 2-3 |
| `parr-s6` | Section 6: unset attributes | 227 / 4 |
| `parr-s7-r1` | Section 7, rule 1: model mutation and side-effecting calls | 229 / 6 |
| `parr-s7-r2` | Section 7, rule 2: dependent attribute computations | 229 / 6 |
| `parr-s7-r3` | Section 7, rule 3: dependent attribute comparisons; structural length checks are permitted | 229 / 6 |
| `parr-s7-r4` | Section 7, rule 4: assumptions about data types and indexing | 229 / 6 |
| `parr-s7-r5` | Section 7, rule 5: display meaning in model attributes | 229 / 6 |
| `parr-s7-urls` | Section 7: URL ownership guidance, separate from the five numbered rules | 229 / 6 |
| `parr-s7-1` | Section 7.1: push versus pull | 229-230 / 6-7 |
| `parr-s8` | Section 8: presence checks, composition, parameters, and application | 230-231 / 7-8 |
| `parr-s8-1` | Section 8.1: attribute renderers and output formatting | 231 / 8 |
| `parr-s9` | Section 9: skins and skin inheritance | 232 / 9 |
| `parr-s9-1` | Section 9.1: template application and chaining | 232 / 9 |
| `parr-s9-2` | Section 9.2: alternating templates | 232 / 9 |
| `parr-s9-3` | Section 9.3: recursive templates | 232-233 / 9-10 |

Important distinctions in the mapping:

- `length(path)` counting is derived from the permitted structural inspection. Its array-only operands, absent-to-zero behavior, conditional semantics, and allowed positions are ScreamJS policies.
- Ordinary presence checks are paper-backed; the exact treatment of `false`, `0`, and empty strings is an engine policy.
- The numeric bracket-index fixture maps to rule 4. This does not claim that Parr mandates a blanket prohibition of all bracket syntax.
- Complete-URL enforcement derives from the URL discussion, not numbered rule 5.
- Scoped composition is supported by the paper; isolation rules and path-only bindings are engine policies.
- HTML-context restrictions, eager validation, diagnostics, static-file path/cycle restrictions, and layout blocks are engine policies. Skin inheritance is not the same as `{% extends %}`/block inheritance.

## Run by Reference

Native tags were introduced in Node 26.2 and backported to 24.19. The project's pinned Node 26.13 supports them, with matching Node 26 type declarations. Tags and their filter flag remain experimental; retain the runtime's warning. See the [Node 26 test-tag documentation](https://nodejs.org/download/release/v26.13.0/docs/api/test.html#test-tags).

Run tests related to structural length inspection:

```powershell
npx tsx --test --experimental-test-tag-filter=parr-s7-r3 lib/template-engine/template-engine.test.ts
```

Run explicitly paper-backed behavior, or ScreamJS-specific contracts:

```powershell
npx tsx --test --experimental-test-tag-filter=parr-direct lib/template-engine/template-engine.test.ts
npx tsx --test --experimental-test-tag-filter=scream-policy lib/template-engine/template-engine.test.ts
```

On the pinned Node version, repeated tag-filter flags intersect: all specified tags must match. For example, to run derived URL restrictions:

```powershell
npx tsx --test --experimental-test-tag-filter=parr-derived --experimental-test-tag-filter=parr-s7-urls lib/template-engine/template-engine.test.ts
```

Keep classifications on individual tests: mixed suites must not inherit a classification or paper reference. Native test events expose tags for reporting tools, but the built-in TAP output does not print the tag list. No custom runner or reporter is required for filtering. Tags do not skip, hide, or change known failures.
