import fs from "node:fs";
import { type DefinitionLink, type DefinitionParams, type Range } from "vscode-languageserver/node";
import { WorkingDocument } from "../document/working_document.js";
import { getLogger } from "../utils/logger.js";
import { fileURLToPath } from "node:url";

const logger = getLogger();

const DIVERT_REGEX = /->(\s*@?[\w\s]+\.?[\w\s]*)(\s*<?-?\s*)?/;

export function onDefinitionRequest(
  params: DefinitionParams,
  workingDocument: WorkingDocument,
): DefinitionLink[] | undefined {
  const position = params.position;
  const content = workingDocument.getContent();
  const lines = content.split("\n");
  const line = lines[position.line];

  const matches = line?.match(DIVERT_REGEX);

  if (matches) {
    const matchPosition = line!.indexOf(matches[0]);
    const matchEnd = matchPosition + matches[0].length;

    if (position.character >= matchPosition && position.character < matchEnd) {
      return handleDivert(
        matches[1]!,
        { line: position.line, start: matchPosition, end: matchEnd },
        workingDocument,
      );
    }
  }

  return;
}

interface DivertPosition {
  line: number;
  start: number;
  end: number;
}

function handleDivert(
  divertValue: string,
  position: DivertPosition,
  workingDocument: WorkingDocument,
): DefinitionLink[] | undefined {
  const trimmedValue = divertValue.trim();

  if (trimmedValue.startsWith("@")) {
    return getExternalFileLink(trimmedValue, position, workingDocument);
  }
  return getBlockLink(trimmedValue, position, workingDocument);
}

function getBlockLink(
  blockName: string,
  position: DivertPosition,
  workingDocument: WorkingDocument,
): DefinitionLink[] | undefined {
  const blockPosition = workingDocument.getBlockPosition(blockName);

  if (!blockPosition) {
    return;
  }

  const targetRange: Range = {
    start: {
      line: blockPosition.line,
      character: blockPosition.column,
    },
    end: {
      line: blockPosition.line,
      character: blockPosition.column + blockPosition.length,
    },
  };

  const targetSelectionRange: Range = {
    start: {
      line: blockPosition.line,
      character: blockPosition.column + blockPosition.length - blockName.length,
    },
    end: {
      line: blockPosition.line,
      character: blockPosition.column + blockPosition.length,
    },
  };

  return [
    {
      originSelectionRange: getDivertSelectionRange(position),
      targetUri: workingDocument.getDocumentUri(),
      targetRange,
      targetSelectionRange,
    },
  ];
}

function getExternalFileLink(
  linkString: string,
  divertPosition: DivertPosition,
  workingDocument: WorkingDocument,
): DefinitionLink[] | undefined {
  const parts = linkString.slice(1).split(".");
  const fileLink = workingDocument.getLinkDocumentUri(parts[0]!);

  if (fileLink && parts.length > 1) {
    const filePath = fileURLToPath(fileLink);

    if (fs.existsSync(filePath)) {
      try {
        const file = fs.readFileSync(filePath, "utf8");
        const anotherDocument = new WorkingDocument(fileLink);
        anotherDocument.updateContent(file);

        return getBlockLink(parts[1]!, divertPosition, anotherDocument);
      } catch (e) {
        logger.error("Failed to read linked file", { e });
      }
    }
  }

  if (fileLink) {
    return [
      {
        originSelectionRange: getDivertSelectionRange(divertPosition),
        targetUri: fileLink,
        targetRange: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        targetSelectionRange: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      },
    ];
  }

  return;
}

function getDivertSelectionRange(position: DivertPosition): Range {
  return {
    start: {
      line: position.line,
      character: position.start,
    },
    end: {
      line: position.line,
      character: position.end,
    },
  };
}
