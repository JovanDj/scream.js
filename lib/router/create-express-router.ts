import express from "express";

export function createExpressRouter(
  options: Parameters<typeof express.Router>[0]
) {
  return express.Router(options);
}
