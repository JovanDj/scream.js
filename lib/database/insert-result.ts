export class InsertResult {
  constructor(
    private readonly _lastId: number,
    private readonly _changes: number,
  ) {}

  /**
   * Id of the last row that was created
   */
  get lastId() {
    return this._lastId;
  }

  /**
   * Number of changes made by last insert statement
   */
  get changes() {
    return this._changes;
  }
}
