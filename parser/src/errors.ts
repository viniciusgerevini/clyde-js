import { Token } from "./lexer";

interface WrongTokenErrorMeta {
  token: Token;
  expectedTokens: string[];
}

/**
 * Error returned when the parser finds an unexpected token.
 **/
export class UnexpectedTokenError extends Error {
  constructor(
    message: string,
    public meta: WrongTokenErrorMeta,
  ) {
    super(message);
    this.name = "UnexpectedTokenError";
  }

  static isUnexpectedTokenError(error: Error): error is UnexpectedTokenError {
    return error.name === "UnexpectedTokenError";
  }
}
