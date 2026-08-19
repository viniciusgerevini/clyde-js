import { Lexer } from "@clyde-lang/parser";

export class WorkingDocument {
  private content: string;

  constructor(private documentUri: string) {
    this.content = "";
  }

  updateContent(newContent: string) {
    this.content = newContent;
    // TODO parse and save diagnostics
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
}
