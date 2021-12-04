import "reflect-metadata";
import { Injector } from "./injector";

export type Constructor<T> = new (...args: unknown[]) => T;
export type GenericClassDecorator<T> = (target: T) => void;

export const Controller = (): ClassDecorator => {
  return (target) => {
    Injector.resolve(target);
  };
};
