import express from "express";
import { ExpressRouter } from "./express-router";

export function createExpressRouter(
  options: Parameters<typeof express.Router>[0]
) {
  return new ExpressRouter(express.Router(options));
}
