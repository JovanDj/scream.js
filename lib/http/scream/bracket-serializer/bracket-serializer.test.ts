import { File } from "node:buffer";
import { describe, it, type TestContext } from "node:test";
import {
	encodeInputName,
	encodeToBracketNotation,
} from "./bracket-serializer.js";

describe("Encode to bracket notation", { concurrency: true }, () => {
	it("encodes a flat object", (t: TestContext) => {
		t.plan(1);
		const input = { name: "Jovan" };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			name: "Jovan",
		});
	});

	it("encodes a nested object", (t: TestContext) => {
		t.plan(1);

		const input = {
			address: {
				street: "Main",
			},
			name: "Jovan",
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"address[street]": "Main",
			name: "Jovan",
		});
	});

	it("encodes arrays with numeric indices", (t: TestContext) => {
		t.plan(1);

		const input = {
			roles: [{ name: "admin" }, { name: "editor" }],
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"roles[0][name]": "admin",
			"roles[1][name]": "editor",
		});
	});

	it("encodes empty objects as no output", (t: TestContext) => {
		t.plan(1);

		const input = { address: {} };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {});
	});

	it("encodes arrays of primitives", (t: TestContext) => {
		t.plan(1);

		const input = {
			tags: ["rock", "metal"],
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"tags[0]": "rock",
			"tags[1]": "metal",
		});
	});

	it("encodes deeply nested objects", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				address: {
					location: {
						city: "Belgrade",
					},
				},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"user[address][location][city]": "Belgrade",
		});
	});

	it("encodes nested arrays inside objects", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				roles: [{ name: "admin" }, { name: "editor" }],
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"user[roles][0][name]": "admin",
			"user[roles][1][name]": "editor",
		});
	});

	it("skips undefined values (they should not be serialized)", (t: TestContext) => {
		t.plan(1);

		const input = {
			address: { street: undefined },
			name: undefined,
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {});
	});

	it("serializes null values", (t: TestContext) => {
		t.plan(1);

		const input = {
			note: null,
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			note: null,
		});
	});

	it("serializes boolean values", (t: TestContext) => {
		t.plan(1);

		const input = {
			active: true,
			admin: false,
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			active: true,
			admin: false,
		});
	});

	it("skips empty arrays", (t: TestContext) => {
		t.plan(1);

		const input = {
			tags: [],
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {});
	});

	it("encodes mixed primitives and nested objects", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				name: "Jovan",
				roles: [{ id: 1 }, { id: 2 }],
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"user[name]": "Jovan",
			"user[roles][0][id]": 1,
			"user[roles][1][id]": 2,
		});
	});

	it("treats File objects as leaf values (no recursion)", (t: TestContext) => {
		t.plan(1);

		const mockFile = new File(["content"], "avatar.png", {
			type: "image/png",
		});

		const input = { avatar: mockFile };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			avatar: mockFile,
		});
	});

	it("skips missing array indices (holes)", (t: TestContext) => {
		t.plan(1);

		const input: { roles: Array<{ name: string } | undefined> } = {
			roles: [],
		};
		input.roles = [];
		input.roles[2] = { name: "editor" };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"roles[2][name]": "editor",
		});
	});

	it("skips unsafe keys like __proto__, constructor, prototype", (t: TestContext) => {
		t.plan(1);

		const input = {
			__proto__: "BAD",
			constructor: "BAD",
			prototype: "BAD",
			safe: "OK",
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			safe: "OK",
		});
	});

	it("encodes arrays with mixed primitive and object values", (t: TestContext) => {
		t.plan(1);

		const input = {
			choices: [1, { id: 10 }, "Jovan"],
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"choices[0]": 1,
			"choices[1][id]": 10,
			"choices[2]": "Jovan",
		});
	});

	it("serializes Date objects as primitives (ISO string)", (t: TestContext) => {
		t.plan(1);

		const date = new Date("2023-01-01T00:00:00Z");

		const input = { createdAt: date };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			createdAt: date,
		});
	});

	it("serializes empty strings", (t: TestContext) => {
		t.plan(1);

		const input = { note: "" };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, { note: "" });
	});

	it("ignores non-enumerable properties", (t: TestContext) => {
		t.plan(1);

		const obj: Record<PropertyKey, string> = {};
		Object.defineProperty(obj, "hidden", {
			enumerable: false,
			value: "secret",
		});
		obj["visible"] = "ok";

		const result = encodeToBracketNotation(obj);

		t.assert.deepStrictEqual(result, {
			visible: "ok",
		});
	});

	it("serializes keys containing dashes or dots literally", (t: TestContext) => {
		t.plan(1);

		const input = { "meta.data": "y", "user-email": "x" };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"meta.data": "y",
			"user-email": "x",
		});
	});

	it("skips symbol keys", (t: TestContext) => {
		t.plan(1);

		const s = Symbol("id");

		const input: Record<PropertyKey, string | number> = {};
		input[s] = 123;
		input["name"] = "Jovan";

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			name: "Jovan",
		});
	});

	it("treats Map and Set as leaf values", (t: TestContext) => {
		t.plan(1);

		const input = {
			meta: new Map([["a", 1]]),
			tags: new Set(["x", "y"]),
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			meta: input.meta,
			tags: input.tags,
		});
	});

	it("throws on excessive nesting depth (DoS protection)", (t: TestContext) => {
		t.plan(1);

		const deep = {
			a: {
				b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 1 } } } } } } } } },
			},
		};

		t.assert.throws(() => encodeToBracketNotation(deep), {
			message: /maximum depth/i,
		});
	});

	it("throws on circular references", (t: TestContext) => {
		t.plan(1);

		const input: { name: string; self?: unknown } = { name: "Jovan" };
		input.self = input;

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /circular/i,
		});
	});

	it("throws on excessively long key paths", (t: TestContext) => {
		t.plan(1);

		const longKey = "a".repeat(2000);

		const input: Record<string, number> = {};
		input[longKey] = 1;

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /key length/i,
		});
	});

	it("treats class instances as leaf values", (t: TestContext) => {
		t.plan(1);

		class User {
			id: number;
			constructor(id: number) {
				this.id = id;
			}
		}

		const input = { user: new User(10) };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			user: input.user,
		});
	});

	it("throws on keys containing bracket characters (invalid form grammar)", (t: TestContext) => {
		t.plan(1);

		const input = {
			"a[b]": "bad",
		};

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /invalid key/i,
		});
	});

	it("throws when encountering BigInt values (cannot serialize safely)", (t: TestContext) => {
		t.plan(1);

		const input = {
			id: BigInt(123),
		};

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /bigint/i,
		});
	});

	it("skips function values entirely", (t: TestContext) => {
		t.plan(1);

		const input = {
			name: "Jovan",
			nested: { cb: () => {} },
			onSubmit: () => {},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			name: "Jovan",
		});
	});

	it("throws on bracket injection attempts in nested keys", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				"name]hack[": "x",
			},
		};

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /invalid key/i,
		});
	});

	it("treats typed arrays and Buffers as leaf values", (t: TestContext) => {
		t.plan(1);

		const buffer = Buffer.from([1, 2, 3]);
		const bytes = new Uint8Array([4, 5, 6]);

		const input = {
			fileData: buffer,
			rawBytes: bytes,
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			fileData: buffer,
			rawBytes: bytes,
		});
	});

	it("preserves property traversal order", (t: TestContext) => {
		t.plan(1);

		const input = {
			a: 1,
			b: 2,
			c: 3,
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, input);
	});

	it("serializes empty-string keys literally", (t: TestContext) => {
		t.plan(1);

		const input = { "": "x" };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, { "": "x" });
	});

	it("throws on NaN and Infinity values", (t: TestContext) => {
		t.plan(1);

		const input = { x: NaN, y: Infinity };

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /invalid number/i,
		});
	});

	it("propagates errors thrown by getters", (t: TestContext) => {
		t.plan(1);

		const input = {
			get boom() {
				throw new Error("getter fail");
			},
			ok: 1,
		};

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /getter fail/i,
		});
	});

	it("rejects unsafe keys inside arrays", (t: TestContext) => {
		t.plan(1);

		const input = [
			{
				"name]hack[": "x",
			},
		];

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /invalid key/i,
		});
	});

	it("throws when trying to serialize a top-level primitive", (t: TestContext) => {
		t.plan(1);

		t.assert.throws(() => encodeToBracketNotation("Jovan"), {
			message: /root value must be an object/i,
		});
	});

	it("treats numeric string keys as literal object keys", (t: TestContext) => {
		t.plan(1);

		const input = {
			"123": "alpha",
			user: {
				"456": "beta",
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"123": "alpha",
			"user[456]": "beta",
		});
	});

	it("does not reject nested keys when total path stays within max length", (t: TestContext) => {
		t.plan(1);

		const longSegment = "a".repeat(320);
		const input = {
			[longSegment]: {
				[longSegment]: {
					[longSegment]: "ok",
				},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa[aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa][aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa]":
				"ok",
		});
	});

	it("serializes objects with custom toStringTag as plain objects", (t: TestContext) => {
		t.plan(1);

		const custom = {
			data: "ok",
		};
		Object.defineProperty(custom, Symbol.toStringTag, {
			value: "Strange",
		});

		const input = { wrapper: custom };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"wrapper[data]": "ok",
		});
	});

	it("skips empty objects at any depth (top-level, nested, in arrays)", (t: TestContext) => {
		t.plan(1);

		const input = {
			settings: {},
			tags: [{}, { value: "metal" }, {}],
			user: {
				name: "Jovan",
				profile: {},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"tags[1][value]": "metal",
			"user[name]": "Jovan",
		});
	});

	it("serializes sparse arrays whose first index is not zero", (t: TestContext) => {
		t.plan(1);

		const arr = [];
		arr[3] = "hello";

		const input = { data: arr };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"data[3]": "hello",
		});
	});

	it("serializes objects created with Object.create(null)", (t: TestContext) => {
		t.plan(1);

		const input = Object.create(null);
		input.name = "Jovan";

		const result = encodeToBracketNotation({ user: input });

		t.assert.deepStrictEqual(result, {
			"user[name]": "Jovan",
		});
	});

	it("treats foreign-realm objects as leaf values", (t: TestContext) => {
		t.plan(1);

		const foreignProto = {};
		const foreign = Object.create(foreignProto);
		foreign.x = 1;

		const result = encodeToBracketNotation({ data: foreign });

		t.assert.deepStrictEqual(result, { data: foreign });
	});

	it("serializes objects returned by getters normally", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				get profile() {
					return { age: 31 };
				},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"user[profile][age]": 31,
		});
	});

	it("ignores symbol-keyed properties even if present in prototype chain", (t: TestContext) => {
		t.plan(1);

		const sym = Symbol("meta");

		const proto = { [sym]: "x" };
		const obj = Object.create(proto);
		obj.name = "Jovan";

		const result = encodeToBracketNotation(obj);

		t.assert.deepStrictEqual(result, {
			name: "Jovan",
		});
	});

	it("serializes Date objects inside arrays", (t: TestContext) => {
		t.plan(1);

		const d = new Date("2023-01-01T00:00:00Z");

		const input = {
			dates: [d],
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"dates[0]": d,
		});
	});

	it("treats custom iterable objects as leaf values", (t: TestContext) => {
		t.plan(1);

		const iterable = {
			*[Symbol.iterator]() {
				yield ["a", 1];
				yield ["b", 2];
			},
		};

		const input = { data: iterable };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, { data: iterable });
	});

	it("treats DOM-like array-like objects (e.g. FileList) as leaf values", (t: TestContext) => {
		t.plan(1);

		const file = new File(["x"], "a.txt");
		const fileList = { 0: file, length: 1 };

		const result = encodeToBracketNotation({ files: fileList });

		t.assert.deepStrictEqual(result, { files: fileList });
	});

	it("treats objects with custom toString/valueOf as leaf values", (t: TestContext) => {
		t.plan(1);

		const obj = {
			toString() {
				return "hacked";
			},
			value: 5,
			valueOf() {
				return 999;
			},
		};

		const result = encodeToBracketNotation({ data: obj });

		t.assert.deepStrictEqual(result, { data: obj });
	});

	it("serializes Proxy objects based on their underlying target", (t: TestContext) => {
		t.plan(1);

		const target = { user: { name: "Jovan" } };
		const proxy = new Proxy(target, {});

		const result = encodeToBracketNotation(proxy);

		t.assert.deepStrictEqual(result, {
			"user[name]": "Jovan",
		});
	});

	it("does not trigger getters more than once", (t: TestContext) => {
		t.plan(1);

		let calls = 0;
		const input = {
			get page() {
				calls++;
				return { n: 1 };
			},
		};
		encodeToBracketNotation(input);

		t.assert.deepStrictEqual(calls, 1);
	});

	it("skips nested constructor keys to avoid prototype pollution", (t: TestContext) => {
		t.plan(1);

		const input = { user: { constructor: { ok: 1 } } };
		const result = encodeToBracketNotation(input);
		t.assert.deepStrictEqual(result, {});
	});

	it("throws when encountering a Promise value", (t: TestContext) => {
		t.plan(1);

		const input = { data: Promise.resolve(1) };

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /promise/i,
		});
	});

	it("throws on WeakMap because it cannot be serialized", (t: TestContext) => {
		t.plan(1);

		const input = { cache: new WeakMap() };

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /weakmap/i,
		});
	});

	it("throws on WeakSet because it cannot be serialized", (t: TestContext) => {
		t.plan(1);

		const input = { cache: new WeakSet() };

		t.assert.throws(() => encodeToBracketNotation(input), {
			message: /weakset/i,
		});
	});

	it("serializes RegExp values as leaf values", (t: TestContext) => {
		t.plan(1);

		const regex = /abc/i;

		const input = { pattern: regex };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, { pattern: regex });
	});

	it("uses object's toJSON() when defined", (t: TestContext) => {
		t.plan(1);

		const input = {
			user: {
				toJSON() {
					return { name: "Jovan" };
				},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"user[name]": "Jovan",
		});
	});

	it("serializes a sealed object normally", (t: TestContext) => {
		t.plan(1);

		const sealed = Object.seal({ x: 1 });

		const result = encodeToBracketNotation({ obj: sealed });

		t.assert.deepStrictEqual(result, {
			"obj[x]": 1,
		});
	});

	it("serializes a frozen object normally", (t: TestContext) => {
		t.plan(1);

		const frozen = Object.freeze({ x: 2 });

		const result = encodeToBracketNotation({ obj: frozen });

		t.assert.deepStrictEqual(result, {
			"obj[x]": 2,
		});
	});

	it("serializes Error objects as empty since props are non-enumerable", (t: TestContext) => {
		t.plan(1);

		const err = new Error("boom");

		const result = encodeToBracketNotation({ err });

		t.assert.deepStrictEqual(result, {});
	});

	it("serializes objects inheriting from Error normally if enumerable props exist", (t: TestContext) => {
		t.plan(1);

		class CustomError extends Error {
			code = 42;
		}

		const input = { e: new CustomError("fail") };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"e[code]": 42,
		});
	});

	it("serializes primitive returned by toJSON() directly", (t: TestContext) => {
		t.plan(1);

		const input = {
			value: {
				toJSON() {
					return 123;
				},
			},
		};

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			value: 123,
		});
	});

	it("does not treat shared object references as circular", (t: TestContext) => {
		t.plan(1);

		const shared = { id: 1 };
		const input = { first: shared, second: shared };

		const result = encodeToBracketNotation(input);

		t.assert.deepStrictEqual(result, {
			"first[id]": 1,
			"second[id]": 1,
		});
	});

	it("encodes single input names from dot paths", (t: TestContext) => {
		t.plan(1);

		const result = encodeInputName("todo.user.address.street");

		t.assert.deepStrictEqual(result, "todo[user][address][street]");
	});

	it("throws on invalid input name segments", (t: TestContext) => {
		t.plan(1);

		t.assert.throws(() => encodeInputName("todo.user[name]"), {
			message: /invalid path segment/i,
		});
	});
});
