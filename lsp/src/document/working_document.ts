import { Lexer, parse, ClydeDocumentRoot, UnexpectedTokenError } from "@clyde-lang/parser";
import { getLogger } from "../utils/logger.js";
import { debounce } from "../utils/debouncer.js";
import { getFileUriInDefaultDialogueFolder, getParseDelayInMs } from "../config.js";
import { pathToFileURL, URL } from "node:url";
import { isAbsolute, extname } from "node:path";

const logger = getLogger();

export interface ErrorInfo {
  start: { line: number; character: number };
  end: { line: number; character: number };
  details: string;
}

type ParseFinishedCallback = (error: ErrorInfo | undefined) => void;

export class WorkingDocument {
  private content: string;
  private parsedDoc: ClydeDocumentRoot | undefined;

  private parseListeners: ParseFinishedCallback[] = [];
  private debouncedParse: Function;

  private wasContentProcessed: boolean = false;
  private tokens: Lexer.Token[] = [];

  constructor(private documentUri: string) {
    this.content = "";
    this.debouncedParse = debounce(() => {
      this.parse();
    }, getParseDelayInMs());
  }

  updateContent(newContent: string) {
    this.content = newContent;
    this.wasContentProcessed = false;
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
        this._notifyParseListeners(genericErroInfo("File parsing failed"));
      }
    }
  }

  getTokens(): Lexer.Token[] {
    if (!this.content) {
      return [];
    }
    if (!this.wasContentProcessed) {
      this.wasContentProcessed = true;
      this.tokens = Lexer.tokenize(this.content).getAll();
    }
    return this.tokens;
  }

  getContent(): string {
    return this.content;
  }

  getDocumentUri(): string {
    return this.documentUri;
  }

  getBlocksNames(): string[] {
    if (!this.parsedDoc) {
      return [];
    }
    return this.parsedDoc.blocks.map((b) => b.name);
  }

  getBlockPosition(
    blockName: string,
  ): { line: number; column: number; length: number } | undefined {
    const tokens = this.getTokens();

    for (let token of tokens) {
      if (token.token === Lexer.TOKENS.BLOCK && token.value === blockName) {
        return { line: token.line, column: token.column, length: token.length! };
      }
    }

    return;
  }

  getLinks(): Record<string, string> {
    if (!this.parsedDoc) {
      return {};
    }
    return this.parsedDoc?.links;
  }

  getLink(linkName: string): string | undefined {
    return this.getLinks()[linkName];
  }

  getLinkDocumentUri(linkName: string): string | undefined {
    let link = this.getLink(linkName);

    if (!link) {
      return link;
    }

    if (extname(link) !== ".clyde") {
      link += ".clyde";
    }

    if (isAbsolute(link)) {
      return pathToFileURL(link).href;
    }

    if (!link.startsWith(".")) {
      return getFileUriInDefaultDialogueFolder(link);
    }

    return new URL(link, this.documentUri).href;
  }

  addParseFinishedListener(callback: ParseFinishedCallback) {
    this.parseListeners.push(callback);
  }

  private _notifyParseListeners(error: ErrorInfo | undefined): void {
    this.parseListeners.forEach((listener) => listener(error));
  }
}

function genericErroInfo(message: string): ErrorInfo {
  const position = {
    line: 0,
    character: 0,
  };
  return {
    start: position,
    end: position,
    details: message,
  };
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
