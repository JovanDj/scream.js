# Bracket Serializer

`encodeToBracketNotation(value)` lives here. It receives any nested value (objects, arrays, DOM-style collections) and produces a flat object whose keys use traditional bracket notation (e.g., `user[address][street]`). This format is still required by many HTML form handlers and server-side frameworks.

## Why it exists

- **Legacy form compatibility:** Browsers submit `name="foo[bar]"` fields as nested hashes on the server. Building these names by hand is error-prone, so the serializer automates it.
- **Safety:** We explicitly guard against prototype-pollution keys, excessively deep trees, unbounded key lengths, unsupported types (Promise, WeakMap/WeakSet, BigInt, NaN/Infinity), and circular references.
- **Type awareness:** Special cases such as `Date`, `Buffer`, typed arrays, FileList-style objects, Errors, custom `toJSON`/`valueOf` implementations, and shared references are all handled deliberately.

## Files

| File | Description |
| --- | --- |
| `bracket-serializer.ts` | Implementation of `encodeToBracketNotation` plus all supporting guards and helpers. |
| `bracket-serializer.test.ts` | Comprehensive `node:test` suite that exercises every branch, from simple objects to edge cases (custom iterables, shared references, invalid inputs). |

## Key behaviors

- **Guard clauses:** Unsafe keys (`__proto__`, `constructor`, `prototype`) are ignored, and bracket characters are rejected outright.
- **Depth & length limits:** Serializing a value deeper than 10 levels or producing a key longer than 1024 characters throws an error.
- **Circular detection:** A `WeakSet` tracks visited objects; if the same object reappears on the current recursion stack, we throw “Circular reference detected.” Shared references across siblings are safe.
- **Special objects:**
  - Arrays use numeric indices (`roles[0][name]`).
  - Typed arrays/Buffers are treated as leaf values.
  - Errors serialize their enumerable properties, but empty Errors collapse to `{}`.
  - Objects with `toJSON` can return either primitives or nested structures; we recursively serialize the result.

## Usage

```ts
import { encodeInputName, encodeToBracketNotation } from "./bracket-serializer.js";

const payload = {
  user: {
    address: { street: "Main", city: "Belgrade" },
    roles: [{ name: "admin" }, { name: "editor" }],
  },
  tags: ["one", "two"],
};

const flat = encodeToBracketNotation(payload);

const titleName = encodeInputName("todo.title");
```

### Rendering in templates

- **Bulk:** expose `flat` (or selected keys) to your template:

```handlebars
{% for name, value in flat %}
  <input type="hidden" name="{{ name }}" value="{{ value }}">
{% endfor %}
```

Alternatively, call `encodeInputName("todo.title")` directly in templates—the helper is automatically injected into the context by `ScreamTemplateEngine`, so you can write:

```html
<input
  type="text"
  name="{{ encodeInputName('todo.title') }}"
  value="{{ todo.title }}"
/>
```

No manual bracket notation is required.

## Testing

Run the suite with:

```bash
npm run test -- lib/http/scream/bracket-serializer/bracket-serializer.test.ts
```

The tests cover:

- Success cases (flat, nested, mixed structures, DOM-like collections).
- Validation failures (unsafe keys, excessive depth, invalid numbers, unsupported types).
- Special behaviors (`toJSON`, shared references, Errors, circular references).
