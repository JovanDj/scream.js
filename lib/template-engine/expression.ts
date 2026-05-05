import type { SourceSpan } from "./template-syntax-error.js";

export type PathSegment = string | number;

export type PathExpressionNode = {
	readonly type: "path";
	readonly segments: readonly PathSegment[];
	readonly span: SourceSpan;
};

export type LiteralExpressionNode = {
	readonly type: "literal";
	readonly value: string | number | boolean;
	readonly span: SourceSpan;
};

export type ExpressionNode = PathExpressionNode | LiteralExpressionNode;
