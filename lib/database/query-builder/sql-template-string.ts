import {
	isSqlPrimitive,
	isSqlQuery,
	type SqlQuery,
	type SqlValue,
} from "./sql-query.js";

/**
 * Tagged template helper to build parameterized SQL queries.
 *
 * Behavior:
 * - Primitive values (`string | number | boolean | null`) become `?` placeholders
 *   with matching entries in `params`.
 * - `undefined` (when not inside an array) is ignored: it produces no placeholder
 *   and no parameter. This makes it easy to compose optional fragments.
 * - Arrays must be non-empty and contain only primitive values. They become a
 *   comma-separated list of `?` placeholders (`IN (?, ?, ?)` etc.), and their
 *   elements are appended to `params` in order. Empty arrays throw.
 * - Nested `SqlQuery` values are inlined: their `sql` is concatenated into the
 *   parent query and their `params` are appended.
 * - Non-primitive, non-`SqlQuery` values (including `Date` and objects) cause
 *   an error. Callers must convert them to primitives or `SqlQuery` fragments
 *   before interpolation.
 *
 * @example
 * const ids = [1, 2];
 * const active = true;
 * const base = sql`WHERE id IN (${ids})`;
 * const query = sql`SELECT * FROM users ${base} AND active = ${active}`;
 * // query.sql    => "SELECT * FROM users WHERE id IN (?, ?) AND active = ?"
 * // query.params => [1, 2, true]
 */
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

				if (!value.every(isSqlPrimitive)) {
					throw new Error(
						"sql: array parameters must contain only primitive values (string | number | boolean | null)",
					);
				}

				const placeholders = value.map(() => "?").join(", ");
				return {
					params: [...acc.params, ...value],
					sql: acc.sql + str + placeholders,
				};
			}

			if (value instanceof Date) {
				throw new Error(
					"sql: Date parameters are not supported; convert to ISO string or Unix timestamp first.",
				);
			}

			if (!isSqlPrimitive(value)) {
				throw new Error(
					`sql: unsupported parameter type: ${typeof value}. Convert to a primitive or SqlQuery first.`,
				);
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
