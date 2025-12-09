export type SqlPrimitive = string | number | boolean | null;
export type SqlArray = readonly SqlPrimitive[];

export type SqlQuery = {
	sql: string;
	params: readonly SqlPrimitive[];
};

export type SqlValue = SqlPrimitive | SqlArray | SqlQuery | undefined;

export const isSqlPrimitive = (val: unknown): val is SqlPrimitive => {
	return (
		typeof val === "string" ||
		typeof val === "number" ||
		typeof val === "boolean" ||
		val === null
	);
};

export const isSqlQuery = (val: unknown): val is SqlQuery => {
	if (!val || typeof val !== "object") {
		return false;
	}

	const hasSqlAndParams = (
		value: object,
	): value is { sql: unknown; params: unknown } => {
		return "sql" in value && "params" in value;
	};

	if (!hasSqlAndParams(val)) {
		return false;
	}

	return typeof val.sql === "string" && Array.isArray(val.params);
};
