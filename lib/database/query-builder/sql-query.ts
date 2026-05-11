export type SqlPrimitive = string | number | boolean | null;

export type SqlQuery = { params: readonly SqlPrimitive[]; sql: string };

export type SqlValue =
	| SqlPrimitive
	| readonly SqlPrimitive[]
	| SqlQuery
	| undefined;

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
