import "reflect-metadata";

export class Injector {
  static injections = new Map<string, unknown>();

  static resolve<T>(target: ReturnType<ClassDecorator>): T {
    if (target) {
      if (this.injections.has(target.name)) {
        console.log(`${target.name} already registered, getting from cache`);
        return this.injections.get(target.name) as T;
      }
      console.log(target);
      // tokens are required dependencies, while injections are resolved tokens from the Injector
      const tokens = target
        ? Reflect.getMetadata("design:paramtypes", target) || []
        : [];
      console.log("TOKENS", tokens);

      let dependencies = [];
      if (tokens.length > 0) {
        dependencies = tokens.map((token: ReturnType<ClassDecorator>) =>
          Injector.resolve<T>(token)
        );
      }

      const construct: T = Reflect.construct(target, [...dependencies]);
      this.injections.set(target.name, construct);

      console.log("Registered dependecy: ", this.injections.get(target.name));
      return construct;
    } else {
      return {} as T;
    }
  }
}
