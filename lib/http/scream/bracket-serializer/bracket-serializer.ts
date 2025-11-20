const MAX_DEPTH = 10;
const MAX_KEY_LENGTH = 1024;

const isRecord = (
	candidate: unknown,
): candidate is Record<PropertyKey, unknown> =>
	typeof candidate === "object" &&
	candidate !== null &&
	!Array.isArray(candidate);

const assertKeyLength = (key: string) => {
	if (key.length > MAX_KEY_LENGTH) {
		throw new Error("Key length exceeds maximum allowed during serialization");
	}
};

const assertPropertyNameSafe = (name: string) => {
	if (/[\\[\]]/.test(name)) {
		throw new Error("Invalid key detected during serialization");
	}
};

export const encodeToBracketNotation = (
	value: unknown,
	prefix = "",
	acc: Record<PropertyKey, unknown> = {},
	depth = 0,
	seen = new WeakSet<object>(),
): Record<PropertyKey, unknown> => {
	const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

	if (depth > MAX_DEPTH) {
		throw new Error("Maximum depth exceeded while serializing");
	}

	if (value === undefined || typeof value === "function") {
		return acc;
	}

	if (typeof value === "bigint") {
		throw new Error("BigInt values are not supported during serialization");
	}

	if (value instanceof Promise) {
		throw new Error("Promise values are not supported during serialization");
	}

	if (value instanceof WeakMap || value instanceof WeakSet) {
		throw new Error("WeakMap/WeakSet cannot be serialized");
	}

	const isPrimitive = value === null || typeof value !== "object";

	if (isPrimitive && !prefix && depth === 0) {
		throw new Error("Root value must be an object");
	}

	if (isPrimitive && typeof value === "number" && !Number.isFinite(value)) {
		throw new Error("Invalid number encountered during serialization");
	}

	if (isPrimitive) {
		acc[prefix] = value;
		return acc;
	}

	if (seen.has(value)) {
		throw new Error("Circular reference detected during serialization");
	}

	const proto = Object.getPrototypeOf(value);
	const isPlainObject = proto === Object.prototype || proto === null;

	seen.add(value);
	try {
		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				const key = `${prefix}[${index}]`;
				assertKeyLength(key);
				encodeToBracketNotation(item, key, acc, depth + 1, seen);
			});
			return acc;
		}

		const hasEnumerableKeys = Object.keys(value).length > 0;
		const hasSymbolKeys = Object.getOwnPropertySymbols(value).length > 0;

		if (isPlainObject && !hasEnumerableKeys && hasSymbolKeys && prefix) {
			acc[prefix] = value;
			return acc;
		}

		const hasNumericKeys = Object.keys(value).some((key) => /^\d+$/.test(key));
		const hasLengthProp =
			typeof Object.getOwnPropertyDescriptor(value, "length")?.value ===
			"number";

		const hasCustomToString =
			Object.hasOwn(value, "toString") &&
			value.toString !== Object.prototype.toString;

		const hasCustomValueOf =
			Object.hasOwn(value, "valueOf") &&
			value.valueOf !== Object.prototype.valueOf;

		const ownToJSONDescriptor = Object.getOwnPropertyDescriptor(
			value,
			"toJSON",
		);

		const toJSONFunction =
			typeof ownToJSONDescriptor?.value === "function"
				? ownToJSONDescriptor.value
				: undefined;

		const hasOwnToJSON = Boolean(toJSONFunction);

		if (isPlainObject && hasLengthProp && hasNumericKeys && prefix) {
			acc[prefix] = value;
			return acc;
		}

		const shouldSerializeSpecialPlain =
			isPlainObject &&
			Boolean(prefix) &&
			(hasCustomToString || hasCustomValueOf || hasOwnToJSON);

		const serializeToJSONResult = (result: unknown) => {
			if (!isRecord(result)) {
				acc[prefix] = result;
				return acc;
			}

			for (const [jsonKey, jsonVal] of Object.entries(result)) {
				const nextKey = `${prefix}[${jsonKey}]`;
				encodeToBracketNotation(jsonVal, nextKey, acc, depth + 1, seen);
			}
			return acc;
		};
		const serializeError = (error: Error) => {
			const entries = Object.entries(error).filter(
				([, entryValue]) => typeof entryValue !== "undefined",
			);

			for (const [key, entryValue] of entries) {
				const nextKey = prefix ? `${prefix}[${key}]` : key;
				encodeToBracketNotation(entryValue, nextKey, acc, depth + 1, seen);
			}
			return acc;
		};

		if (shouldSerializeSpecialPlain && !toJSONFunction) {
			acc[prefix] = value;
			return acc;
		}

		if (shouldSerializeSpecialPlain && toJSONFunction) {
			return serializeToJSONResult(toJSONFunction(value));
		}

		if (prefix === "") {
			const entries = Object.entries(value).filter(
				([k, v]) => !unsafeKeys.has(k) && typeof v !== "undefined",
			);

			for (const [k, v] of entries) {
				assertPropertyNameSafe(k);
				assertKeyLength(k);
				encodeToBracketNotation(v, k, acc, depth + 1, seen);
			}
			return acc;
		}

		if (!isPlainObject && value instanceof Error) {
			return serializeError(value);
		}

		if (!isPlainObject) {
			acc[prefix] = value;
			return acc;
		}

		for (const [k, v] of Object.entries(value)) {
			if (unsafeKeys.has(k)) {
				continue;
			}
			assertPropertyNameSafe(k);
			const key = prefix ? `${prefix}[${k}]` : k;
			encodeToBracketNotation(v, key, acc, depth + 1, seen);
		}

		return acc;
	} finally {
		seen.delete(value);
	}
};

export const encodeInputName = (path: string) => {
	const segments = path
		.split(".")
		.map((segment) => segment.trim())
		.filter(Boolean);

	if (segments.length === 0) {
		throw new Error("Path must contain at least one segment");
	}

	const unsafeSegment = segments.find((segment) => /[[\]]/.test(segment));
	if (unsafeSegment) {
		throw new Error(`Invalid path segment: ${unsafeSegment}`);
	}

	const [head, ...rest] = segments;

	return rest.length === 0 ? head : `${head}[${rest.join("][")}]`;
};
