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
				return { sql: acc.sql + str, params: acc.params };
			}
			if (isSqlQuery(value)) {
				return {
					sql: acc.sql + str + value.sql,
					params: [...acc.params, ...(value.params || [])],
				};
			}
			if (!Array.isArray(value)) {
				return { sql: `${acc.sql + str}?`, params: [...acc.params, value] };
			}
			if (value.length === 0) {
				return {
					sql: `${acc.sql + str}?`,
					params: [...acc.params, null],
				};
			}
			const placeholders = value.map(() => "?").join(", ");
			return {
				sql: acc.sql + str + placeholders,
				params: [...acc.params, ...value],
			};
		},
		{ sql: "", params: [] },
	);
	return { sql: result.sql, params: result.params };
};
