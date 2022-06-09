export class ClydeDocumentRoot {
  public readonly type = 'document';
  constructor(public content: ContentNode[] = [], public blocks: BlockNode[] = []) {};
}

export class ContentNode {
  public readonly type = 'content';
  constructor(public content: any) {}; // TODO check if there is a better definition
}

export class BlockNode {
  public readonly type = 'block';
  constructor(public name: string, public content: ContentNode) {};
}

export class LineNode {
  public readonly type = 'line';

  constructor (
    public value: string,
    public speaker?: string,
    public id?: string,
    public tags?: string[]
  ) {};
}

export class OptionsNode {
  public readonly type = 'options';

  constructor (
    public content: (LogicBlockNode | OptionNode)[],
    public name?: string,
    public id?: string,
    public speaker?: string,
    public tags?: string[]
  ) {};
}

export class OptionNode {
  public readonly type = 'option';

  constructor (
    public content: ContentNode,
    public mode?: string,
    public name?: string,
    public id?: string,
    public speaker?: string,
    public tags?: string[]
  ) {};
}

export class DivertNode { 
  public readonly type = 'divert';
  public target: string;

  constructor (target: string) {
    if (target === 'END') {
      this.target = '<end>';
    } else {
      this.target = target;
    }
  }
}

export class VariationsNode {
  public readonly type = 'variations';
  constructor(public mode: string, public content: ContentNode[] = []) {};
}

export class VariableNode {
  public readonly type = 'variable';
  constructor(public name: string) {};
}

export type OperandNode = LiteralNode | NullTokenNode | ExpressionNode | VariableNode;

export interface LiteralNode {
  type: 'literal';
  name: string;
  value: any;
}

export class NumberLiteralNode implements LiteralNode {
  public type = 'literal' as 'literal';
  public name = "number";

  constructor(public value: number) {};

  static create(value: string) {
    return new NumberLiteralNode(Number(value));
  }
}

export class BooleanLiteralNode implements LiteralNode {
  public type = 'literal' as 'literal';
  public name = "boolean";

  constructor(public value: boolean) {};

  static create(value: string) {
    return new BooleanLiteralNode(value === 'true');
  }
}

export class StringLiteralNode implements LiteralNode {
  public type = 'literal' as 'literal';
  public name = "string";

  constructor(public value: string) {};

  static create(value: string) {
    return new StringLiteralNode(value);
  }
}

export class NullTokenNode {
  public readonly type = 'null';
}

export class ConditionalContentNode {
  public readonly type = 'conditional_content';
  constructor (public conditions: OperandNode, public content?: any) {}; // TODO replace any with something
}

export class ActionContentNode {
  public readonly type = 'action_content';
  constructor (public action: EventsNode | AssignmentsNode, public content?: any) {}; // TODO replace any with something
}

export class ExpressionNode {
  public readonly type = 'expression';
  constructor(public name: string, public elements: OperandNode[]) {};
}

export class AssignmentsNode {
  public type = 'assignments';
  constructor (public assignments: (AssignmentNode| VariableNode)[]) {}; // TODO variable node is temporary until { set banana } is fixed
}

export class AssignmentNode {
  public type = 'assignment';
  constructor (public variable: VariableNode, public operation: string, public value: OperandNode | AssignmentNode) {};
}

export class EventsNode {
  public type = 'events';
  constructor (public events: EventNode[]) {};
}

export class EventNode {
  public type = 'event';
  constructor (public name: string) {};
}

export type LogicBlockNode = ConditionalContentNode | ActionContentNode;

