import { isSqlQuery, type SqlQuery, type SqlValue } from "./sql-query.js";

export const sql = (
	strings: TemplateStringsArray,
	...values: SqlValue[]
): SqlQuery => {
	const result = strings.reduce<SqlQuery>(
		(acc, str, i) => {
			const value = values[i];

			if (value === undefined) {
				return { params: acc.params, sql: acc.sql + str };
			}

			if (isSqlQuery(value)) {
				return {
					params: [...acc.params, ...value.params],
					sql: acc.sql + str + value.sql,
				};
			}

			if (Array.isArray(value)) {
				if (value.length === 0) {
					throw new Error(
						"sql: empty array interpolation is not allowed; handle this at call site",
					);
				}

				const placeholders = value.map(() => "?").join(", ");
				return {
					params: [...acc.params, ...value],
					sql: acc.sql + str + placeholders,
				};
			}

			return {
				params: [...acc.params, value],
				sql: `${acc.sql + str}?`,
			};
		},
		{ params: [], sql: "" },
	);

	return result;
};
