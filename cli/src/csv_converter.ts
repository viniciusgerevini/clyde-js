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
}

interface NodeOptions {
  separator: string;
}

export function csvConverter(clydeDocument: ClydeDocumentRoot, options: ConverterOptions = {}): string {
  const separator = options.separator ? options.separator : ';';
  const noHeader = options.noHeader === true;
  let header = '';

  if (!noHeader) {
    header = options.header ? options.header + '\n' : `id${separator}text\n`;
  }

  let csvLines = clydeDocument.content.reduce((acc, next) => {
    return acc.concat(parseContent(next, { separator }));
  }, []);

  csvLines = csvLines.concat(clydeDocument.blocks.reduce((acc, next) => {
    return acc.concat(parseContent(next.content, { separator }));
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
  return csvLine(line.id, line.value, cfg);
}

function parseOptionsNode(options: OptionsNode, cfg: NodeOptions): string[] {
  const result = [];
  if (options.name) {
    result.push(csvLine(options.id, options.name, cfg));
  }

  return result.concat(parseNextNode(options.content, cfg));
}

function parseOptionNode(option: OptionNode, cfg: NodeOptions): string[] {
  const result = [];

  // handle display only options
  if (!option.content.content?.length || (option.content.content[0].id !== option.id || (!option.id && option.name !== option.content.content[0].value))) {
    result.push(csvLine(option.id, option.name, cfg));
  }

  return result.concat(parseContent(option.content, cfg));
}

function csvLine(id: string, text: string, cfg: NodeOptions) {
  return `${id || ''}${cfg.separator}${sanitizeText(text, cfg)}`;
}

function sanitizeText(text: string, cfg: NodeOptions) {
  if (text.includes(cfg.separator)) {
    return `"${text.replace(/\"/g, '\\"')}"`;
    
  }
  return text;
}
