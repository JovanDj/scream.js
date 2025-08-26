import type { SqlQuery } from "./sql-query.js";

const isSqlQuery = (val: unknown): val is SqlQuery => {
	return (
		typeof val === "object" && val !== null && "sql" in val && "params" in val
	);
};

export const sql = (
	strings: TemplateStringsArray,
	...values: unknown[]
): SqlQuery => {
	const result = strings.reduce<{ sql: string; params: readonly unknown[] }>(
		(acc, str, i) => {
			const value = values[i];
			if (value === undefined) {
				return { params: acc.params, sql: acc.sql + str };
			}
			if (isSqlQuery(value)) {
				return {
					params: [...acc.params, ...(value.params || [])],
					sql: acc.sql + str + value.sql,
				};
			}
			if (!Array.isArray(value)) {
				return { params: [...acc.params, value], sql: `${acc.sql + str}?` };
			}
			if (value.length === 0) {
				return {
					params: [...acc.params, null],
					sql: `${acc.sql + str}?`,
				};
			}
			const placeholders = value.map(() => "?").join(", ");
			return {
				params: [...acc.params, ...value],
				sql: acc.sql + str + placeholders,
			};
		},
		{ params: [], sql: "" },
	);
	return { params: result.params, sql: result.sql };
};
