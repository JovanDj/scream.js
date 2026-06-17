import type { ExpressionNode } from "./expression.js";
import type { SourceSpan } from "./template-syntax-error.js";

export type TemplateASTNode =
	| TextNode
	| VariableNode
	| IfNode
	| ApplyNode
	| TemplateDefinitionNode
	| ExtendsNode
	| BlockNode;

export type TextNode = {
	readonly type: "text";
	readonly value: string;
	readonly span: SourceSpan;
};

export type VariableNode = {
	readonly type: "variable";
	readonly expression: ExpressionNode;
	readonly span: SourceSpan;
};

export type IfNode = {
	readonly type: "if";
	readonly condition: ExpressionNode;
	readonly children: readonly TemplateASTNode[];
	readonly alternate: readonly TemplateASTNode[];
	readonly span: SourceSpan;
};

export type ApplyNode = {
	readonly type: "apply";
	readonly source: ExpressionNode;
	readonly children: readonly TemplateASTNode[];
	readonly templateName?: string;
	readonly span: SourceSpan;
};

export type TemplateDefinitionNode = {
	readonly type: "template";
	readonly name: string;
	readonly children: readonly TemplateASTNode[];
	readonly span: SourceSpan;
};

export type ExtendsNode = {
	readonly type: "extends";
	readonly template: string;
	readonly span: SourceSpan;
};

export type BlockNode = {
	readonly type: "block";
	readonly name: string;
	readonly children: readonly TemplateASTNode[];
	readonly span: SourceSpan;
};
