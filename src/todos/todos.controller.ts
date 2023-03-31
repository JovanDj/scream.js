export class TodosController {
  findAll({ res }) {
    return res.end("FIND ALL");
  }

  findOne({ res }: HTTPContext) {
    return res.end("FIND ONE");
  }

  create({ req, res }: HTTPContext) {
    console.log(req.body);
    return res.end("CREATE");
  }
}
