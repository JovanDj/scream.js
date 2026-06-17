import type { SourceSpan } from "./template-syntax-error.js";

export type PathExpressionNode = {
	readonly type: "path";
	readonly segments: readonly string[];
	readonly span: SourceSpan;
};

export type ExpressionNode = PathExpressionNode;
