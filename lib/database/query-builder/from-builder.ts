import { GroupByExpression } from "./expressions/group-by-expression.js";
import { HavingExpression } from "./expressions/having-expression.js";
import { JoinExpression } from "./expressions/join-expression.js";
import { LimitExpression } from "./expressions/limit-expression.js";
import { OffsetExpression } from "./expressions/offset-expression.js";
import { OrderByExpression } from "./expressions/order-by-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { SqlBuilder } from "./sql-builder.js";

export class FromBuilder extends SqlBuilder {
	where(condition: string, operator: string, param: string) {
		return new FromBuilder(
			[...this.expressions, new WhereExpression(condition, operator)],
			[...this.params, param],
		);
	}

	orderBy(field: string, direction: "ASC" | "DESC" = "ASC") {
		return new FromBuilder(
			[...this.expressions, new OrderByExpression(field, direction)],
			[...this.params],
		);
	}

	groupBy(fields: string) {
		return new FromBuilder(
			[...this.expressions, new GroupByExpression(fields)],
			[...this.params],
		);
	}

	having(condition: string, operator: string, param: string) {
		return new FromBuilder(
			[...this.expressions, new HavingExpression(condition, operator)],
			[...this.params, param],
		);
	}

	limit(limit: number) {
		return new FromBuilder(
			[...this.expressions, new LimitExpression(limit)],
			[...this.params],
		);
	}

	offset(offset: number) {
		return new FromBuilder(
			[...this.expressions, new OffsetExpression(offset)],
			[...this.params],
		);
	}

	join(
		table: string,
		condition: string,
		type: "INNER" | "LEFT" | "RIGHT" | "FULL" = "INNER",
	) {
		return new FromBuilder(
			[...this.expressions, new JoinExpression(table, condition, type)],
			[...this.params],
		);
	}
}
