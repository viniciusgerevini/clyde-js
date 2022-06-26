import {
  ClydeDocumentRoot,
  ContentNode,
  LineNode,
  OptionsNode,
  OptionNode,
} from '@clyde-lang/parser';

interface ConverterOptions {
  header?: string;
  separator?: string;
  noHeader?: boolean;
  withMetadata?: boolean;
}

interface NodeOptions {
  separator: string;
  withMetadata: boolean;
}

export function csvConverter(clydeDocument: ClydeDocumentRoot, options: ConverterOptions = {}): string {
  const separator = options.separator ? options.separator : ';';
  const noHeader = options.noHeader === true;
  const withMetadata = options.withMetadata;
  let header = '';

  if (!noHeader) {
    const metadata = withMetadata ? `${separator}metadata`: '';
    header = options.header ? options.header + '\n' : `id${separator}text${metadata}\n`;
  }

  let csvLines = clydeDocument.content.reduce((acc, next) => {
    return acc.concat(parseContent(next, { separator, withMetadata }));
  }, []);

  csvLines = csvLines.concat(clydeDocument.blocks.reduce((acc, next) => {
    return acc.concat(parseContent(next.content, { separator, withMetadata }));
  }, []));

  return header + csvLines.join('\n');
}

function parseContent(content: ContentNode, cfg: NodeOptions): string[] {
  return parseNextNode(content.content, cfg);
}

function parseNextNode(next: any, cfg: NodeOptions): string[] {
  if (next.length) {
    return next.reduce((acc: string[], next: any) => {
      return acc.concat(parseNextNode(next, cfg));
    }, []);
  }

  if (next.type === 'content') {
    return parseContent(next, cfg);
  }

  if (next.type === 'line') {
    return [parseLineNode(next, cfg)];
  }

  if (next.type === 'options') {
    return parseOptionsNode(next, cfg);
  } 

  if (next.type === 'variations') {
    return parseNextNode(next.content, cfg);
  } 

  if (next.type === 'action_content') {
    return parseNextNode(next.content, cfg);
  } 

  if (next.type === 'conditional_content') {
    return parseNextNode(next.content, cfg);
  } 

  if (next.type === 'option') {
    return parseOptionNode(next, cfg);
  }
  return [];
}

function parseLineNode(line: LineNode, cfg: NodeOptions): string {
  return csvLine(line.id, line.value, line.speaker, line.tags, cfg);
}

function parseOptionsNode(options: OptionsNode, cfg: NodeOptions): string[] {
  const result = [];
  if (options.name) {
    result.push(csvLine(options.id, options.name, options.speaker, options.tags, cfg));
  }

  return result.concat(parseNextNode(options.content, cfg));
}

function parseOptionNode(option: OptionNode, cfg: NodeOptions): string[] {
  const result = [];

  // handle display only options
  if (!option.content.content?.length || (option.content.content[0].id !== option.id || (!option.id && option.name !== option.content.content[0].value))) {
    result.push(csvLine(option.id, option.name, option.speaker, option.tags, cfg));
  }

  return result.concat(parseContent(option.content, cfg));
}

function csvLine(id: string, text: string, speaker: string, tags: string[], cfg: NodeOptions) {
  let metadata: string[] = [];

  if (cfg.withMetadata) {
    if (speaker) {
      metadata.push(`speaker: ${speaker}`);
    }
    if (tags && tags.length) {
      metadata.push("tags: " + tags.map(t => `#${t}`).join(" "));
    }
  }

  return `${id || ''}${cfg.separator}${sanitizeText(text, cfg)}${cfg.withMetadata ? cfg.separator + metadata.join(" "): ''}`;
}

function sanitizeText(text: string, cfg: NodeOptions) {
  if (text.includes(cfg.separator)) {
    return `"${text.replace(/\"/g, '\\"')}"`;
    
  }
  return text;
}
