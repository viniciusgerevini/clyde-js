import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Position,
  type CompletionParams,
} from "vscode-languageserver";
import type { WorkingDocument } from "../document/working_document.js";
import { Lexer } from "@clyde-lang/parser";

const DIVERT_REGEX = /->(\s*)(@?([\w\s]+)?)?$/;
const VARIATION_REGEX = /^\s*({.*})?\s*\(\s*(\w+\s*\w*)?\s*\)?$/;
const SPEAKER_COMPLETION_SHORTCUT_REGEX = /^\s*(\{.*\})?\s*:([\w- .]+)?/;
const TAG_REGEX = /(?<!\\)#([\w-.]+)?$/;

const DIVERT_END_OPTION: CompletionItem = {
  label: "END",
  kind: CompletionItemKind.Keyword,
};

export function getCompletionOptions(
  completionParams: CompletionParams,
  workingDocument: WorkingDocument,
): CompletionItem[] | CompletionList {
  const position = completionParams.position;
  const content = workingDocument.getContent();
  const lines = content.split("\n");
  const line = lines[position.line];
  const lineUpToColumn = line?.slice(0, position.character + 1);

  const divertMatches = lineUpToColumn?.match(DIVERT_REGEX);

  if (divertMatches) {
    return handleDivertCompletion(workingDocument, divertMatches[2] || "");
  }

  const variationMatches = lineUpToColumn?.match(VARIATION_REGEX);

  if (variationMatches) {
    return handleVariationCompletion(variationMatches[2] || "");
  }

  const speakerMatches = lineUpToColumn?.match(SPEAKER_COMPLETION_SHORTCUT_REGEX);

  if (speakerMatches) {
    return handleSpeakerCompletion(workingDocument, speakerMatches[2] || "", position);
  }

  const tagMatches = lineUpToColumn?.match(TAG_REGEX);

  if (tagMatches) {
    return handleTagCompletion(workingDocument, tagMatches[1] || "");
  }

  return [];
}

function handleDivertCompletion(workingDocument: WorkingDocument, text: string): CompletionItem[] {
  const trimmed = text.trim().toLowerCase();
  const blocks = workingDocument.getBlocksNames();

  if (!trimmed) {
    const r = blocks.map(blockItem);
    r.push(DIVERT_END_OPTION);

    for (let link in workingDocument.getLinks()) {
      const linkWithPrefix = `@${link}`;
      r.push(linkItem(linkWithPrefix));
    }
    return r;
  }

  const result: CompletionItem[] = [];

  for (let block of blocks) {
    if (block.toLowerCase().includes(trimmed)) {
      result.push(blockItem(block));
    }
  }

  if (trimmed.includes("@")) {
    for (let link in workingDocument.getLinks()) {
      const linkWithPrefix = `@${link}`;
      const searchWithoutPrefix = trimmed.replace("@", "");
      if (linkWithPrefix.toLowerCase().includes(searchWithoutPrefix)) {
        result.push(linkItem(linkWithPrefix));
      }
    }
  }

  return result;
}

const VARIATION_OPTIONS = [
  "shuffle",
  "cycle",
  "once",
  "sequence",
  "shuffle cycle",
  "shuffle once",
  "shuffle sequence",
];

function handleVariationCompletion(text: string): CompletionItem[] {
  const trimmed = text.trim().toLowerCase();

  if (!trimmed) {
    return VARIATION_OPTIONS.map(variationItem);
  }

  const result: CompletionItem[] = [];

  for (let variation of VARIATION_OPTIONS) {
    if (variation.includes(trimmed)) {
      result.push(variationItem(variation));
    }
  }

  return result;
}

function handleSpeakerCompletion(
  workingDocument: WorkingDocument,
  text: string,
  position: Position,
): CompletionItem[] {
  const trimmed = text.trim().toLowerCase();
  const tokens = workingDocument.getTokens();
  const speakers: Set<string> = new Set();
  const results: CompletionItem[] = [];

  for (let token of tokens) {
    if (token.token === Lexer.TOKENS.SPEAKER && token.value) {
      if (!speakers.has(token.value) && (!trimmed || token.value.toLowerCase().includes(trimmed))) {
        speakers.add(token.value);
        results.push(speakerItem(token.value, position));
      }
    }
  }

  return results;
}

function handleTagCompletion(workingDocument: WorkingDocument, text: string): CompletionItem[] {
  const trimmed = text.trim().toLowerCase();
  const tokens = workingDocument.getTokens();
  const tags: Set<string> = new Set();
  const results: CompletionItem[] = [];

  for (let token of tokens) {
    if (token.token === Lexer.TOKENS.TAG && token.value) {
      if (!tags.has(token.value) && (!trimmed || token.value.toLowerCase().includes(trimmed))) {
        tags.add(token.value);
        results.push(tagItem(token.value));
      }
    }
  }

  return results;
}

function blockItem(label: string): CompletionItem {
  return {
    label,
    kind: CompletionItemKind.Reference,
    labelDetails: { description: "Block" },
  };
}

function variationItem(label: string): CompletionItem {
  return {
    label,
    kind: CompletionItemKind.Keyword,
    labelDetails: { description: "variation mode" },
  };
}

function linkItem(label: string): CompletionItem {
  return {
    label,
    kind: CompletionItemKind.Reference,
    labelDetails: { description: "File" },
  };
}

function speakerItem(label: string, position: Position): CompletionItem {
  return {
    label,
    kind: CompletionItemKind.Variable,
    labelDetails: { description: "Speaker" },
    textEdit: {
      newText: `${label}: `,
      insert: {
        start: {
          line: position.line,
          character: position.character - 1,
        },
        end: position,
      },
      replace: {
        start: position,
        end: position,
      },
    },
  };
}

function tagItem(label: string): CompletionItem {
  return {
    label: `#${label}`,
    insertText: label,
    kind: CompletionItemKind.Variable,
    labelDetails: { description: "Tag" },
  };
}
