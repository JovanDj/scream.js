export class InsertResult {
  constructor(private readonly _lastId?: number) {}

  /**
   * Id of the last row that was created
   */
  get lastId() {
    return this._lastId;
  }
}
