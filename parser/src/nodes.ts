export class ClydeDocumentRoot {
  public readonly type = 'document';
  constructor(public content = [], public blocks = []) {};
}

export const ContentNode = (content) => {
  return { type: 'content', content };
};

export const BlockNode = (blockName, content) => {
  return { type: 'block', name: blockName, content };
}

export const LineNode = (value: string, speaker?: string, id?: string, tags?: string[]) => {
  return { type: 'line', value, speaker, id, tags };
};

export const OptionsNode = (content, name?: string, id?: string, speaker?: string, tags?: string) => {
  return { type: 'options', name, content, id, speaker, tags };
}

export const OptionNode = (content, mode?: string, name?: string, id?: string, speaker?: string, tags?: string) => {
  return { type: 'option', name, mode, content, id, speaker, tags };
}

export const DivertNode = (target) => {
  if (target === 'END') {
    target = '<end>';
  }
  return { type: 'divert', target };
}

export const VariationsNode = (mode, content = []) => {
  return { type: 'variations', mode, content };
}

export const VariableNode = (name) => {
  return { type: 'variable', name };
}

export const NumberLiteralNode = (value) => {
  return LiteralNode('number', Number(value));
}

export const BooleanLiteralNode = (value) => {
  return LiteralNode('boolean', value === 'true');
}

export const StringLiteralNode = (value) => {
  return LiteralNode('string', value);
}

export const LiteralNode = (name, value) => {
  return { type: 'literal', name, value };
}

export const NullTokenNode = () => {
  return { type: 'null' };
}

export const ConditionalContentNode = (conditions, content?) => {
  return { type: 'conditional_content', conditions, content };
}

export const ActionContentNode = (action, content?) => {
  return { type: 'action_content', action, content };
}

export const ExpressionNode = (name, elements) => {
  return { type: 'expression', name, elements };
}

export const AssignmentsNode = (assignments) => {
  return { type: 'assignments', assignments };
}

export const AssignmentNode = (variable, operation, value) => {
  return { type: 'assignment', variable, operation, value };
}

export const EventsNode = (events) => {
  return { type: 'events', events };
}

export const EventNode = (name) => {
  return { type: 'event', name };
}
