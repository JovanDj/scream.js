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

	static create() {
		return new HtmlAttributes([]);
	}

	static fromRecord(attributes: Record<string, HtmlAttributeValue>) {
		return new HtmlAttributes(
			Object.entries(attributes).map(([name, value]) => ({ name, value })),
		);
	}

	private constructor(entries: readonly HtmlAttributeEntry[]) {
		this.#entries = entries.map((entry) => {
			assertValidAttributeName(entry.name);
			return { ...entry };
		});
	}

	set(name: string, value: HtmlAttributeValue) {
		return new HtmlAttributes([
			...this.#entries.filter((entry) => entry.name !== name),
			{ name, value },
		]);
	}

	when(condition: boolean, name: string, value: HtmlAttributeValue = true) {
		if (!condition) {
			return this;
		}

		return this.set(name, value);
	}

	class(classes: Record<string, boolean>) {
		const className = Object.entries(classes)
			.filter(([, enabled]) => enabled)
			.map(([name]) => name)
			.join(" ");

		if (className.length === 0) {
			return this;
		}

		const existingClass = this.#entries.find((entry) => {
			return entry.name === "class";
		});
		const nextClass = [existingClass?.value, className]
			.filter((value) => {
				return typeof value === "string" && value.length > 0;
			})
			.join(" ");

		return this.set("class", nextClass);
	}

	get entries(): readonly HtmlAttributeEntry[] {
		return this.#entries.map((entry) => {
			return { ...entry };
		});
	}
}

export function assertValidAttributeName(name: string) {
	if (/^[^\s"'/>=]+$/.test(name)) {
		return;
	}

	throw new Error(`Invalid HTML attribute name: ${name}`);
}
