import { Lexer, parse, ClydeDocumentRoot, UnexpectedTokenError } from "@clyde-lang/parser";
import { getLogger } from "../logger.js";
import { debounce } from "../utils/debouncer.js";

const logger = getLogger();

export interface ErrorInfo {
  start: { line: number; character: number };
  end: { line: number; character: number };
  details: string;
}

type ParseFinishedCallback = (error: ErrorInfo | undefined) => void;

export class WorkingDocument {
  private content: string;
  //@ts-ignore
  private parsedDoc: ClydeDocumentRoot | undefined;

  private parseListeners: ParseFinishedCallback[] = [];
  private debouncedParse: Function;

  constructor(private documentUri: string) {
    this.content = "";
    this.debouncedParse = debounce(() => {
      this.parse();
    }, 300);
  }

  updateContent(newContent: string) {
    this.content = newContent;
    this.debouncedParse();
  }

  parse(): void {
    logger.info("Document parsing starterd", { uri: this.documentUri });
    try {
      this.parsedDoc = parse(this.content);
      logger.info("Document parsing finished", { uri: this.documentUri });
      this._notifyParseListeners(undefined);
    } catch (e) {
      const error = e as Error;
      logger.error(error);
      if (UnexpectedTokenError.isUnexpectedTokenError(error)) {
        this._notifyParseListeners(errorToDiagnosticInfo(error));
      } else {
        this._notifyParseListeners(undefined);
      }
    }
  }

  getTokens(): Lexer.Token[] {
    if (!this.content) {
      return [];
    }
    return Lexer.tokenize(this.content).getAll();
  }

  getContent(): string {
    return this.content;
  }

  getDocumentUri(): string {
    return this.documentUri;
  }

  addParseFinishedListener(callback: ParseFinishedCallback) {
    this.parseListeners.push(callback);
  }

  private _notifyParseListeners(error: ErrorInfo | undefined): void {
    this.parseListeners.forEach((listener) => listener(error));
  }
}

function errorToDiagnosticInfo(error: UnexpectedTokenError): ErrorInfo {
  const start = {
    line: error.meta.token.line,
    character: error.meta.token.column,
  };
  const end = {
    line: start.line,
    character: start.character + (error.meta.token.length || 0),
  };
  return {
    start,
    end,
    details: error.message,
  };
}
