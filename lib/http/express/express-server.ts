import express from "express";
import { Server } from "../server.js";

export class ExpressServer implements Server, Disposable {
  constructor(
    private readonly _server: ReturnType<express.Application["listen"]>
  ) {}

  get nodeServer() {
    return this._server;
  }

  close() {
    this._server.close();
  }

  [Symbol.dispose]() {
    this._server.close();
  }
}
