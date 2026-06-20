export class SafeHtml {
	readonly #html: string;

	static fromTrustedHtml(html: string) {
		return new SafeHtml(html);
	}

	private constructor(html: string) {
		this.#html = html;
	}

	get html() {
		return this.#html;
	}
}

export type HtmlAttributeValue = string | number | boolean | null | undefined;

export type HtmlAttributeEntry = {
	readonly name: string;
	readonly value: HtmlAttributeValue;
};

export class HtmlAttributes {
	readonly #entries: readonly HtmlAttributeEntry[];

	static fromRecord(attributes: Record<string, HtmlAttributeValue>) {
		return new HtmlAttributes(
			Object.entries(attributes).map(([name, value]) => {
				return { name, value };
			}),
		);
	}

	private constructor(entries: readonly HtmlAttributeEntry[]) {
		this.#entries = entries.map((entry) => {
			return { ...entry };
		});
	}

	get entries(): readonly HtmlAttributeEntry[] {
		return this.#entries.map((entry) => {
			return { ...entry };
		});
	}
}
