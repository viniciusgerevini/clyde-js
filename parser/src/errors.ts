interface WrongTokenErrorMeta {
  line: number;
  column: number;
  expectedTokens: string[];
}

export class WrongTokenError extends Error {
  constructor(
    message: string,
    public meta: WrongTokenErrorMeta,
  ) {
    super(message);
    this.name = "WrongTokenError";
  }
}
