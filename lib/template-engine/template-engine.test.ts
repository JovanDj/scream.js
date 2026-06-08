import { describe, it, type TestContext } from "node:test";
import type { RenderContext } from "./context.js";
import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { ScreamTemplateEngine } from "./template-engine.js";

describe("ScreamTemplateEngine", { concurrency: true }, () => {
	const setupTemplateEngine = () => {
		const fileLoader = new InMemoryFileLoader();
		const templateEngine = ScreamTemplateEngine.create(fileLoader);

		return { fileLoader, templateEngine };
	};

	describe("Variable replacement", () => {
		it("should replace a single variable", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();

			const template = "Hello, {{ name }}!";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace an object key", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ user.name }}!";
			const context: RenderContext = { user: { name: "John" } };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace a nested object key", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ dto.user.name }}!";
			const context: RenderContext = { dto: { user: { name: "John" } } };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace a bracket string path", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = `{{ user["display-name"] }}`;
			const context: RenderContext = { user: { "display-name": "Ada" } };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Ada");
		});

		it("should replace an array index path", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ errors.title[0] }}";
			const context: RenderContext = { errors: { title: ["Required"] } };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Required");
		});

		it("should replace keyword-like object keys", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ user.if }} {{ user.in }} {{ user.for }}";
			const context: RenderContext = {
				user: { for: "loop", if: "condition", in: "collection" },
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "condition collection loop");
		});

		it("should replace multiple variables", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context: RenderContext = { name: "John", place: "Serbia" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Hello, John! Welcome to Serbia.",
			);
		});

		it("should throw for missing variables", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }}! Welcome to {{ place }}.";
			const context: RenderContext = { name: "John" };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /place/);
		});

		it("should return an empty string for an empty template", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should ignore extra variables in the context", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }}!";
			const context: RenderContext = { age: 30, name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should handle falsy values correctly", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Age: {{ age }}, Active: {{ active }}.";
			const context: RenderContext = { active: false, age: 0 };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Age: 0, Active: false.");
		});

		it("should handle whitespace inside placeholders", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{   name   }}!";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should replace duplicate placeholders", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ name }} {{ name }} {{ name }}";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "John John John");
		});

		it("should handle nested braces gracefully", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "This is {{ notAVariable }} example.";
			const context: RenderContext = { notAVariable: "{{nested}}" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "This is {{nested}} example.");
		});

		it("should throw for empty variable names", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ }}!";
			const context: RenderContext = { "": "" };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Empty/);
		});

		it("should return the template unchanged if no variables exist", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, world!";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, world!");
		});

		it("should throw for non-primitive context values", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"Array: {{ array }}, Object: {{ obj }}, Function: {{ func }}.";
			const context: RenderContext = {
				array: [1, 2],
				func: () => {},
				obj: { key: "value" },
			};

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Cannot render/);
		});

		it("should throw for direct object rendering", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ user }}";
			const context: RenderContext = { user: { name: "John" } };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Cannot render value/);
		});

		it("should throw for direct array rendering", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ items }}";
			const context: RenderContext = { items: ["a", "b"] };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Cannot render value/);
		});

		it("should ignore malformed placeholders", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, { name }} and {{ place }";
			const context: RenderContext = { name: "John", place: "Serbia" };

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Unclosed variable tag/);
		});

		it("should throw for non-serializable or symbolic values", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ magic }}";
			const context: RenderContext = { magic: Symbol("test") };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Cannot render/);
		});

		it("should throw if dot notation path hits non-object before reaching key", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ user.name.first }}";
			const context: RenderContext = { user: { name: "John" } };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Missing value/);
		});
	});

	describe("Input escape", () => {
		it("should escape HTML special characters", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }}!";
			const context: RenderContext = {
				name: "<script>alert('XSS')</script>",
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Hello, &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;!",
			);
		});

		it("should not escape normal strings", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }}!";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});

		it("should throw when escaping a missing variable", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Hello, {{ name }} and {{ title }}!";
			const context: RenderContext = { name: "<Admin>", title: undefined };

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Cannot render/);
		});

		it("should escape all HTML special characters", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Input: {{ userInput }}";
			const context: RenderContext = {
				userInput: '<div class="test">&</div>',
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Input: &lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;",
			);
		});

		it("should escape single quotes", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Message: '{{ message }}'";
			const context: RenderContext = { message: "O'Reilly's book" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Message: 'O&#39;Reilly&#39;s book'",
			);
		});

		it("should escape double quotes", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Attribute: {{ attribute }}";
			const context: RenderContext = { attribute: '"test"' };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Attribute: &quot;test&quot;");
		});

		it("should escape ampersands", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Symbol: {{ symbol }}";
			const context: RenderContext = { symbol: "&" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Symbol: &amp;");
		});

		it("should escape a combination of special characters", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ content }}";
			const context: RenderContext = {
				content: "<script>alert('XSS & test');</script>",
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"&lt;script&gt;alert(&#39;XSS &amp; test&#39;);&lt;/script&gt;",
			);
		});

		it("should handle empty strings without escaping", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Value: {{ empty }}";
			const context: RenderContext = { empty: "" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Value: ");
		});

		it("should not escape numbers", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Number: {{ number }}";
			const context: RenderContext = { number: 12345 };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Number: 12345");
		});

		it("should not escape boolean values", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Boolean: {{ boolValue }}";
			const context: RenderContext = { boolValue: true };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Boolean: true");
		});

		it("should not escape non-variable parts of the template", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Static content with <tags> and & symbols.";
			const context: RenderContext = {};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(
				result,
				"Static content with <tags> and & symbols.",
			);
		});

		it("should not re-escape already escaped input", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "Value: {{ value }}";
			const context: RenderContext = { value: "&lt;script&gt;" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Value: &lt;script&gt;");
		});

		it("should not re-escape known safe entities while escaping raw HTML", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ value }}";
			const context: RenderContext = { value: "&lt;safe&gt;<unsafe>" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "&lt;safe&gt;&lt;unsafe&gt;");
		});
	});

	describe("Conditionals", () => {
		it("should handle simple conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% if isLoggedIn %} Welcome, {{ name }}! {% endif %}";
			const context: RenderContext = { isLoggedIn: true, name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, " Welcome, John! ");
		});

		it("should handle conditionals with else", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if isLoggedIn %} Welcome! {% else %} Please log in. {% endif %}";
			const context: RenderContext = { isLoggedIn: false };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, " Please log in. ");
		});

		it("should throw for missing variables in conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if isAdmin %} Admin Panel {% else %} User Panel {% endif %}";
			const context: RenderContext = {};

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /isAdmin/);
		});

		it("should handle conditionals with content outside", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% if name %}Name{% else %}{% endif %}After";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "NameAfter");
		});

		it("should handle conditionals with content outside", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"Before{% if name %}Inside{% else %}Else{% endif %}After";
			const context: RenderContext = { name: "John" };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle conditionals with content before and after", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"Before{% if condition %}Inside{% else %}Else{% endif %}After";
			const context: RenderContext = { condition: true };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "BeforeInsideAfter");
		});

		it("should handle nested conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context: RenderContext = { condition1: true, condition2: false };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Outer");
		});

		it("should handle deeply nested conditionals with alternate branches", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% else %}Fallback{% endif %}{% else %}Default{% endif %}";
			const context: RenderContext = { condition1: true, condition2: false };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "OuterFallback");
		});

		it("should throw for missing variables in nested conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if condition1 %}Outer{% if condition2 %}Inner{% endif %}{% endif %}";
			const context: RenderContext = {};

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /condition1/);
		});

		it("should handle multiple independent conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if condition1 %}First{% endif %}Middle{% if condition2 %}Second{% endif %}";
			const context: RenderContext = { condition1: true, condition2: false };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "FirstMiddle");
		});

		it("should treat 0 as falsy in conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% if count %}Has count{% else %}No count{% endif %}";
			const context: RenderContext = { count: 0 };
			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "No count");
		});

		it("should treat non-empty string as truthy in conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if username %}Hi, {{ username }}{% else %}Guest{% endif %}";
			const context: RenderContext = { username: "Alice" };
			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "Hi, Alice");
		});

		it("should treat empty string as falsy in conditionals", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if empty %}Has value{% else %}Empty string{% endif %}";
			const context: RenderContext = { empty: "" };
			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "Empty string");
		});

		describe("Conditionals - dot notation in if conditions", () => {
			it("should evaluate truthy dot notation expressions correctly", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: RenderContext = { items: [{ id: 1 }, { id: 2 }] };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Items exist");
			});

			it("should evaluate falsy dot notation expressions correctly when array is empty", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: RenderContext = { items: [] };

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "No items");
			});

			it("should throw when dot notation condition property is missing", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if items.length %}Items exist{% else %}No items{% endif %}";
				const context: RenderContext = {};

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, /items/);
			});

			it("should evaluate truthy deeply nested dot notation expressions", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: RenderContext = {
					user: { profile: { name: "Alice" } },
				};

				const result = templateEngine.render(template, context);

				t.assert.deepStrictEqual<string>(result, "Hello");
			});

			it("should throw when inner dot notation condition property is missing", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: RenderContext = { user: { profile: {} } };

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, /user\.profile\.name/);
			});

			it("should throw when intermediate dot notation condition value is not an object", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: RenderContext = { user: { profile: null } };

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, /user\.profile\.name/);
			});

			it("should throw when top-level dot notation condition value is not an object", (t: TestContext) => {
				t.plan(1);
				const { templateEngine } = setupTemplateEngine();
				const template =
					"{% if user.profile.name %}Hello{% else %}No name{% endif %}";
				const context: RenderContext = { user: "notAnObject" };

				const act = () => templateEngine.render(template, context);

				t.assert.throws(act, /user\.profile\.name/);
			});
		});

		it("should handle interleaved text, conditionals, and loops", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"A {% if x %} B {% for y in ys %} C {% endfor %} D {% endif %} E";
			const context: RenderContext = { x: true, ys: ["item"] };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "A  B  C  D  E");
		});

		it("should handle nested conditionals containing nested loops", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% if show %}{% for group in groups %}{% if group.visible %}{% for item in group.items %}{{ group.name }}:{{ item }};{% endfor %}{% endif %}{% endfor %}{% else %}Hidden{% endif %}";
			const context: RenderContext = {
				groups: [
					{ items: ["A", "B"], name: "one", visible: true },
					{ items: ["C"], name: "two", visible: false },
					{ items: ["D"], name: "three", visible: true },
				],
				show: true,
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "one:A;one:B;three:D;");
		});
	});

	describe("Iterations", () => {
		it("should iterate over a simple array", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: RenderContext = { letters: ["A", "B", "C"] };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, " A  B  C ");
		});

		it("should render nothing for an empty array", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: RenderContext = { letters: [] };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "");
		});

		it("should support nested loops", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for user in users %}{% for task in user.tasks %}{{ user.name }}-{{ task }};{% endfor %}{% endfor %}";
			const context: RenderContext = {
				users: [
					{ name: "Alice", tasks: ["t1", "t2"] },
					{ name: "Bob", tasks: ["t3"] },
				],
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "Alice-t1;Alice-t2;Bob-t3;");
		});

		it("should throw for non-array collections", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for item in items %} {{ item }} {% endfor %}";
			const context: RenderContext = { items: "not an array" };

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /Loop collection must be an array/);
		});

		it("should shadow parent context variables in for loop", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for item in items %}{{ item }}, {% endfor %}";
			const context: RenderContext = { item: "outer", items: ["a", "b"] };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "a, b, ");
		});

		it("should throw when the collection variable is missing", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for letter in letters %} {{ letter }} {% endfor %}";
			const context: RenderContext = {};

			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /letters/);
		});

		it("should allow iterator shadowing without leaking outer values", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in outer %}[{% for item in inner %}{{ item }}, {% endfor %}|{{ item }}]{% endfor %}";
			const context: RenderContext = {
				inner: ["i1", "i2"],
				outer: ["o1", "o2"],
			};

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "[i1, i2, |o1][i1, i2, |o2]");
		});

		it("should preserve existing context after loops complete", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in items %}{{ item }}{% endfor %}{{ item }}";
			const context: RenderContext = { item: "outer", items: ["X", "Y"] };

			const result = templateEngine.render(template, context);

			t.assert.deepStrictEqual<string>(result, "XYouter");
		});

		it("should support dot notation in collection reference", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context: RenderContext = {
				user: { items: [{ name: "A" }, { name: "B" }] },
			};
			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "A B ");
		});

		it("should throw if dot-notated collection is undefined", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in user.items %}{{ item.name }} {% endfor %}";
			const context: RenderContext = {};
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /user\.items/);
		});

		it("should throw for collections with null or undefined values", (t: TestContext) => {
			t.plan(2);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for item in items %}{{ item }} {% endfor %}";

			const contextWithNull: RenderContext = { items: null };
			const contextWithUndefined: RenderContext = {};

			const renderWithNullCollection = () =>
				templateEngine.render(template, contextWithNull);
			const renderWithUndefinedCollection = () =>
				templateEngine.render(template, contextWithUndefined);

			t.assert.throws(
				renderWithNullCollection,
				/Loop collection must be an array/,
			);
			t.assert.throws(renderWithUndefinedCollection, /items/);
		});

		it("should iterate over a collection of objects and use dot notation", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% for item in items %}{{ item.name }} {% endfor %}";
			const context: RenderContext = {
				items: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }],
			};

			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "Alpha Beta Gamma ");
		});

		it("should iterate over a collection and handle nested properties", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in items %}{{ item.meta.name }} {% endfor %}";
			const context: RenderContext = {
				items: [
					{ meta: { name: "X" } },
					{ meta: { name: "Y" } },
					{ meta: { name: "Z" } },
				],
			};

			const result = templateEngine.render(template, context);
			t.assert.deepStrictEqual<string>(result, "X Y Z ");
		});

		it("should throw when an iterator variable is referenced outside the for loop", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template =
				"{% for item in items %}{{ item }} {% endfor %}{{ item }}";
			const context: RenderContext = { items: ["One"] };
			const act = () => templateEngine.render(template, context);

			t.assert.throws(act, /item/);
		});
	});

	describe("Layouts", () => {
		it("should render all overridden blocks correctly", (t: TestContext) => {
			t.plan(1);
			const { templateEngine, fileLoader } = setupTemplateEngine();

			fileLoader.setTemplate(
				"layout.scream",
				"<header>{% block header %}Default Header{% endblock header %}</header><main>{% block content %}Default Content{% endblock content %}</main><footer>{% block footer %}Default Footer{% endblock footer %}</footer>",
			);

			const childTemplate = `{% extends "layout.scream" %}
			{% block header %}Custom Header{% endblock header %}
			{% block content %}Custom Content{% endblock content %}
			{% block footer %}Custom Footer{% endblock footer %}`;

			const result = templateEngine.render(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Custom Header</header><main>Custom Content</main><footer>Custom Footer</footer>",
			);
		});

		it("should preserve default blocks if only some are overridden", (t: TestContext) => {
			t.plan(1);
			const { templateEngine, fileLoader } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<header>{% block header %}Default Header{% endblock header %}</header><main>{% block content %}Default Content{% endblock content %}</main><footer>{% block footer %}Default Footer{% endblock footer %}</footer>",
			);
			const childTemplate = `{% extends "layout.scream" %}
			{% block content %}Only Content Changed{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Default Header</header><main>Only Content Changed</main><footer>Default Footer</footer>",
			);
		});

		it("should preserve unknown blocks in the layout", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			const layoutWithExtraBlock =
				"<main>{% block content %}Default Content{% endblock content %}</main>{% block sidebar %}Default Sidebar{% endblock sidebar %}";

			fileLoader.setTemplate("layout.scream", layoutWithExtraBlock);

			const childTemplate = `{% extends "layout.scream" %}
			{% block content %}Main Page{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<main>Main Page</main>Default Sidebar",
			);
		});

		it("should support nested layouts and override hierarchy", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"base.scream",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main><footer>{% block footer %}Base Footer{% endblock footer %}</footer>`,
			);

			fileLoader.setTemplate(
				"parent.scream",
				`{% extends "base.scream" %}{% block header %}Parent Header{% endblock header %}{% block content %}Parent Content{% endblock content %}`,
			);

			const childTemplate = `{% extends "parent.scream" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});

			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main><footer>Base Footer</footer>",
			);
		});

		it("should support 4-level nested layout inheritance", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"base.scream",
				"<main>{% block content %}Base{% endblock content %}</main>",
			);
			fileLoader.setTemplate(
				"level1.scream",
				`{% extends "base.scream" %}{% block content %}Level1{% endblock content %}`,
			);
			fileLoader.setTemplate(
				"level2.scream",
				`{% extends "level1.scream" %}{% block content %}Level2{% endblock content %}`,
			);
			const childTemplate = `{% extends "level2.scream" %}{% block content %}Level3{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});
			t.assert.deepStrictEqual<string>(result, "<main>Level3</main>");
		});

		it("should combine parent and child block overrides correctly", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"base.scream",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main>`,
			);
			fileLoader.setTemplate(
				"parent.scream",
				`{% extends "base.scream" %}{% block header %}Parent Header{% endblock header %}`,
			);
			const childTemplate = `{% extends "parent.scream" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});
			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main>",
			);
		});

		it("should combine parent and child block overrides correctly with render()", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"base.scream",
				`<header>{% block header %}Base Header{% endblock header %}</header><main>{% block content %}Base Content{% endblock content %}</main>`,
			);

			fileLoader.setTemplate(
				"parent.scream",
				`{% extends "base.scream" %}{% block header %}Parent Header{% endblock header %}`,
			);

			const childTemplate = `{% extends "parent.scream" %}{% block content %}Child Content{% endblock content %}`;

			const result = templateEngine.render(childTemplate, {});

			t.assert.deepStrictEqual<string>(
				result,
				"<header>Parent Header</header><main>Child Content</main>",
			);
		});

		it("should throw on cyclic layout extends", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"a.scream",
				`{% extends "b.scream" %}{% block content %}A{% endblock %}`,
			);
			fileLoader.setTemplate(
				"b.scream",
				`{% extends "a.scream" %}{% block content %}B{% endblock %}`,
			);

			const act = () =>
				templateEngine.render(
					`{% extends "a.scream" %}{% block content %}Root{% endblock %}`,
					{},
				);

			t.assert.throws(act, / cyclic extends /i);
		});

		it("should throw on self-referencing layout extends", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				`{% extends "layout.scream" %}{% block content %}Layout{% endblock %}`,
			);

			const act = () => templateEngine.renderView("layout.scream", {});

			t.assert.throws(
				act,
				/Cyclic extends detected: layout\.scream -> layout\.scream/,
			);
		});

		it("should throw on cycles reached from anonymous templates", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"a.scream",
				`{% extends "b.scream" %}{% block content %}A{% endblock %}`,
			);
			fileLoader.setTemplate(
				"b.scream",
				`{% extends "a.scream" %}{% block content %}B{% endblock %}`,
			);
			const template = `{% extends "a.scream" %}{% block content %}Root{% endblock %}`;

			const act = () => templateEngine.render(template, {});

			t.assert.throws(
				act,
				/Cyclic extends detected: a\.scream -> b\.scream -> a\.scream/,
			);
		});

		it("should throw when extends is not the first meaningful directive", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock %}</main>",
			);

			const act = () =>
				templateEngine.render(
					`<p>Before</p>{% extends "layout.scream" %}{% block content %}Child{% endblock %}`,
					{},
				);

			t.assert.throws(act, /Extends must be the first meaningful directive/);
		});

		it("should throw when a child overrides an unknown block", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock %}</main>",
			);

			const act = () =>
				templateEngine.render(
					`{% extends "layout.scream" %}{% block sidebar %}Child{% endblock %}`,
					{},
				);

			t.assert.throws(act, /Unknown template block: sidebar/);
		});

		it("should throw when a child overrides the same block twice", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock %}</main>",
			);

			const act = () =>
				templateEngine.render(
					`{% extends "layout.scream" %}{% block content %}One{% endblock %}{% block content %}Two{% endblock %}`,
					{},
				);

			t.assert.throws(act, /Duplicate template block: content/);
		});

		it("should throw when a layout defines the same block twice", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"{% block content %}One{% endblock %}{% block content %}Two{% endblock %}",
			);

			const act = () =>
				templateEngine.render(
					`{% extends "layout.scream" %}{% block content %}Child{% endblock %}`,
					{},
				);

			t.assert.throws(act, /Duplicate template block: content/);
		});

		it("should throw when an extending template defines a nested block", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock %}</main>",
			);

			const act = () =>
				templateEngine.render(
					`{% extends "layout.scream" %}{% block content %}{% block nested %}Nested{% endblock %}{% endblock %}`,
					{},
				);

			t.assert.throws(
				act,
				/Nested template blocks are not allowed in extending templates/,
			);
		});

		it("should throw when extends appears inside a conditional", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate(
				"layout.scream",
				"<main>{% block content %}Default{% endblock %}</main>",
			);
			const template = `{% if show %}{% extends "layout.scream" %}{% endif %}`;
			const context: RenderContext = { show: false };

			const act = () => templateEngine.render(template, context);

			t.assert.throws(
				act,
				/Extends directives are only allowed at the top level/,
			);
		});

		it("should include view names in syntax errors", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("broken.scream", `{% include "nav.scream" %}`);

			const act = () => templateEngine.renderView("broken.scream", {});

			t.assert.throws(act, /Unknown directive.*in broken\.scream/);
		});

		it("should include view names in render errors", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("broken.scream", "{{ missing }}");

			const act = () => templateEngine.renderView("broken.scream", {});

			t.assert.throws(act, /missing.*in broken\.scream/);
		});

		it("should include layout view names in syntax errors", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("layout.scream", `{% include "nav.scream" %}`);
			const template = `{% extends "layout.scream" %}{% block content %}Child{% endblock %}`;

			const act = () => templateEngine.render(template, {});

			t.assert.throws(act, /Unknown directive.*in layout\.scream/);
		});

		it("should include parent layout view names in syntax errors", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("layout.scream", `{% include "nav.scream" %}`);
			fileLoader.setTemplate(
				"page.scream",
				`{% extends "layout.scream" %}{% block content %}Page{% endblock %}`,
			);

			const act = () => templateEngine.renderView("page.scream", {});

			t.assert.throws(act, /Unknown directive.*in layout\.scream/);
		});

		it("should render a view by logical view name", (t: TestContext) => {
			t.plan(1);
			const { fileLoader, templateEngine } = setupTemplateEngine();
			fileLoader.setTemplate("home.scream", "Hello, {{ name }}!");

			const result = templateEngine.renderView("home.scream", { name: "John" });

			t.assert.deepStrictEqual<string>(result, "Hello, John!");
		});
	});

	describe("Syntax errors", () => {
		it("should throw for unknown directives", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = `{% include "x.scream" %}`;
			const act = () => templateEngine.render(template, {});

			t.assert.throws(act, /Unknown directive/);
		});

		it("should throw for unclosed directive tags", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% if user";
			const act = () => templateEngine.render(template, { user: true });

			t.assert.throws(act, /Unclosed directive tag/);
		});

		it("should throw for malformed paths", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{{ user. }}";
			const act = () => templateEngine.render(template, { user: {} });

			t.assert.throws(act, /Expected identifier token|Malformed path/);
		});

		it("should throw for mismatched endblock names", (t: TestContext) => {
			t.plan(1);
			const { templateEngine } = setupTemplateEngine();
			const template = "{% block header %}Header{% endblock content %}";
			const act = () => templateEngine.render(template, {});

			t.assert.throws(act, /Mismatched endblock name/);
		});
	});
});
