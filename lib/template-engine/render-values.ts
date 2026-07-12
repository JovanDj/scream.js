import type { RenderNode } from "./render-node.js";

export class RenderedTemplateValue {
	readonly #nodes: readonly RenderNode[];

	static fromNodes(nodes: readonly RenderNode[]) {
		return new RenderedTemplateValue(nodes);
	}

	private constructor(nodes: readonly RenderNode[]) {
		this.#nodes = nodes;
	}

	get nodes() {
		return this.#nodes;
	}
}

export class FormattedDate {
	readonly #date: Date;
	readonly #locale: Intl.LocalesArgument;
	readonly #options: Intl.DateTimeFormatOptions;

	static fromDate(
		date: Date,
		locale?: Intl.LocalesArgument,
		options: Intl.DateTimeFormatOptions = {},
	) {
		return new FormattedDate(date, locale, options);
	}

	private constructor(
		date: Date,
		locale: Intl.LocalesArgument,
		options: Intl.DateTimeFormatOptions,
	) {
		this.#date = new Date(date);
		this.#locale = locale;
		this.#options = { ...options };
	}

	get date() {
		return new Date(this.#date);
	}

	get locale() {
		return this.#locale;
	}

	get options() {
		return { ...this.#options };
	}
}

export class FormattedNumber {
	readonly #value: number;
	readonly #locale: Intl.LocalesArgument;
	readonly #options: Intl.NumberFormatOptions;

	static fromNumber(
		value: number,
		locale?: Intl.LocalesArgument,
		options: Intl.NumberFormatOptions = {},
	) {
		return new FormattedNumber(value, locale, options);
	}

	private constructor(
		value: number,
		locale: Intl.LocalesArgument,
		options: Intl.NumberFormatOptions,
	) {
		this.#value = value;
		this.#locale = locale;
		this.#options = { ...options };
	}

	get value() {
		return this.#value;
	}

	get locale() {
		return this.#locale;
	}

	get options() {
		return { ...this.#options };
	}
}
