import { Token } from "./lexer";

interface WrongTokenErrorMeta {
  token: Token;
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
