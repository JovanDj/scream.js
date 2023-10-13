import express from "express";
import { Server } from "../server.js";

export class ExpressServer implements Server, Disposable {
  constructor(
    private readonly server: ReturnType<express.Application["listen"]>,
  ) {}

  close() {
    this.server.close();
  }

  [Symbol.dispose]() {
    this.server.close();
  }
}
