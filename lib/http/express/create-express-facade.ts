import express from "express";
import { ExpressFacade } from "./express-facade.js";

export function createExpressFacade() {
  return new ExpressFacade(express())
    .useSession()
    .useBodyParser()
    .useCookieParser()
    .useCors()
    .useHelmet()
    .useSession();
}
