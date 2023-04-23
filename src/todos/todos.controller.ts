import { type Request, type Response } from "express";

export class TodosController {
  findAll({ res }: { req: Request; res: Response }) {
    return res.status(200).send("FIND ALL");
  }

  findOne({ res }: { req: Request; res: Response }) {
    return res.status(200).send("FIND ONE");
  }

  create({ res }: { req: Request; res: Response }) {
    return res.status(201).send("CREATE");
  }
}
