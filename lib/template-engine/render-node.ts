export type RenderNode = RenderTextNode | RenderBlockNode;

export type RenderTextNode = {
	readonly type: "text";
	readonly value: string;
};

export type RenderBlockNode = {
	readonly type: "block";
	readonly children: readonly RenderNode[];
};
