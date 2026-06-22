import type { VariableRenderPosition } from "./ast.js";

export type RenderNode = RenderTextNode | RenderValueNode | RenderBlockNode;

export type RenderTextNode = {
	readonly type: "text";
	readonly value: string;
};

export type RenderValueNode = {
	readonly type: "value";
	readonly value: unknown;
	readonly expression: string;
	readonly renderPosition?: VariableRenderPosition;
};

export type RenderBlockNode = {
	readonly type: "block";
	readonly children: readonly RenderNode[];
};
