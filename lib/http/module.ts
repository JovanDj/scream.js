import type { Application } from "./application.js";

export interface HttpModule {
	mount(app: Application): void;
}
