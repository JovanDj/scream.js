import { FromExpression } from "./expressions/from-expression.js";
import { FromBuilder } from "./from-builder.js";
import { SqlBuilder } from "./sql-builder.js";

export class SelectBuilder extends SqlBuilder {
	from(table: string) {
		return new FromBuilder([...this.expressions, new FromExpression(table)]);
	}
}
