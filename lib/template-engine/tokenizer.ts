import { TemplateScanner } from "./template-scanner.js";
import type { SourceSpan } from "./template-syntax-error.js";

export type Token =
	| { readonly type: "text"; readonly value: string; readonly span: SourceSpan }
	| { readonly type: "openVariable"; readonly span: SourceSpan }
	| { readonly type: "closeVariable"; readonly span: SourceSpan }
	| { readonly type: "openDirective"; readonly span: SourceSpan }
	| { readonly type: "closeDirective"; readonly span: SourceSpan }
	| {
			readonly type: "word";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| {
			readonly type: "string";
			readonly value: string;
			readonly span: SourceSpan;
	  }
	| { readonly type: "dot"; readonly span: SourceSpan }
	| { readonly type: "comma"; readonly span: SourceSpan }
	| { readonly type: "colon"; readonly span: SourceSpan };

export class Tokenizer {
	tokenize(template: string): readonly Token[] {
		return new TemplateScanner(template).scanTokens();
	}
}
