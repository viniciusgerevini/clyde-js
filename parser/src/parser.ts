import { TOKENS, tokenize, getTokenFriendlyHint, Token } from './lexer';

import {
  ClydeDocumentRoot,
  ContentNode,
  BlockNode,
  LineNode,
  OptionsNode,
  OptionNode,
  DivertNode,
  VariationsNode,
  VariableNode,
  NumberLiteralNode,
  BooleanLiteralNode,
  StringLiteralNode,
  NullTokenNode,
  ConditionalContentNode,
  ActionContentNode,
  ExpressionNode,
  AssignmentsNode,
  AssignmentNode,
  EventsNode,
  EventNode,
  OperandNode,
  LogicBlockNode,
  ActionableNode,
} from './nodes';

const variationsModes = ['sequence', 'once', 'cycle', 'shuffle', 'shuffle sequence', 'shuffle once', 'shuffle cycle' ];
const operators = {
  [TOKENS.AND]: { precedence: 1, associative: 'LEFT' },
  [TOKENS.OR]: { precedence: 1, associative: 'LEFT' },
  [TOKENS.EQUAL]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.NOT_EQUAL]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.GREATER]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.LESS]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.GE]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.LE]: { precedence: 2, associative: 'LEFT' },
  [TOKENS.PLUS]: { precedence: 3, associative: 'LEFT' },
  [TOKENS.MINUS]: { precedence: 3, associative: 'LEFT' },
  [TOKENS.MOD]: { precedence: 4, associative: 'LEFT' },
  [TOKENS.MULT]: { precedence: 5, associative: 'LEFT' },
  [TOKENS.DIV]: { precedence: 5, associative: 'LEFT' },
  [TOKENS.POWER]: { precedence: 7, associative: 'RIGHT' },
};

const assignmentOperators = {
  [TOKENS.ASSIGN]: 'assign',
  [TOKENS.ASSIGN_SUM]: 'assign_sum',
  [TOKENS.ASSIGN_SUB]: 'assign_sub',
  [TOKENS.ASSIGN_MULT]: 'assign_mult',
  [TOKENS.ASSIGN_DIV]: 'assign_div',
  [TOKENS.ASSIGN_POW]: 'assign_pow',
  [TOKENS.ASSIGN_MOD]: 'assign_mod',
};

type NestedLogicBlocks = {
  root: LogicBlockNode;
  wrapper: LogicBlockNode;
}


/**
 * Parses Clyde dialogue string to Clyde object
 *
 */
export default function parse(doc: string): ClydeDocumentRoot {
  const tokens = tokenize(doc);
  // console.log(tokenize(doc).getAll());
  // console.log(JSON.stringify(test.getAll()));
  let currentToken: Token;
  let lookaheadTokens = [];
  let isMultilineEnabled = true;

  const wrongTokenError = (token: Token, expected: string[]) => {
    throw new Error(`Unexpected token "${getTokenFriendlyHint(token.token)}" on line ${token.line+1} column ${token.column+1}. Expected ${expected.map(getTokenFriendlyHint).join(', ')} `);
  }

  const consume = (expected: string[]) => {
    if (!lookaheadTokens.length) {
      lookaheadTokens.push(tokens.next());
    }

    const lookahead = lookaheadTokens.shift();

    if (expected && (!lookahead || !expected.includes(lookahead.token))) {
      wrongTokenError(lookahead, expected);
    }

    currentToken = lookahead;
    return currentToken;
  };

  const peek = (expected?: string[], offset = 0) => {
    while (lookaheadTokens.length < (offset + 1)) {
      const token = tokens.next();
      lookaheadTokens.push(token);
      if (token.token == TOKENS.EOF) {
        break;
      }
    }
    const lookahead = lookaheadTokens[offset];

    if (!expected || (lookahead && expected.includes(lookahead.token))) {
      return lookahead;
    }
  };

  const Document = (): ClydeDocumentRoot => {
    const expected = [
      TOKENS.EOF,
      TOKENS.SPEAKER,
      TOKENS.TEXT,
      TOKENS.OPTION,
      TOKENS.STICKY_OPTION,
      TOKENS.FALLBACK_OPTION,
      TOKENS.DIVERT,
      TOKENS.DIVERT_PARENT,
      TOKENS.BRACKET_OPEN,
      TOKENS.BRACE_OPEN,
    ];
    const next = peek();

    switch (next.token) {
      case TOKENS.EOF:
        return new ClydeDocumentRoot();
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
      case TOKENS.OPTION:
      case TOKENS.STICKY_OPTION:
      case TOKENS.FALLBACK_OPTION:
      case TOKENS.DIVERT:
      case TOKENS.DIVERT_PARENT:
      case TOKENS.BRACKET_OPEN:
      case TOKENS.BRACE_OPEN:
      case TOKENS.LINE_BREAK:
        const result =  new ClydeDocumentRoot([new ContentNode(Lines())]);
        if (peek([TOKENS.BLOCK])) {
          result.blocks = Blocks();
        }
        return result;
      case TOKENS.BLOCK:
        return new ClydeDocumentRoot([], Blocks());
      default:
        wrongTokenError(next, expected);
    };
  };

  const Blocks = (): BlockNode[] => {
    consume([TOKENS.BLOCK]);
    let blocks =  [
      new BlockNode(currentToken.value, new ContentNode(Lines()))
    ];

    while (peek([TOKENS.BLOCK])) {
      blocks = blocks.concat(Blocks());
    }

    return blocks;
  };

  const Lines = (): ActionableNode[] => {
    const acceptableNext = [
      TOKENS.SPEAKER,
      TOKENS.TEXT,
      TOKENS.OPTION,
      TOKENS.STICKY_OPTION,
      TOKENS.FALLBACK_OPTION,
      TOKENS.DIVERT,
      TOKENS.DIVERT_PARENT,
      TOKENS.BRACKET_OPEN,
      TOKENS.BRACE_OPEN,
      TOKENS.LINE_BREAK,
    ];
    let lines: ActionableNode[];

    const tk = peek(acceptableNext);

    if (!tk) {
      return [];
    }

    switch (tk.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
        consume([ TOKENS.SPEAKER, TOKENS.TEXT ]);
        const line = DialogueLine();
        if (peek([TOKENS.BRACE_OPEN])) {
          consume([TOKENS.BRACE_OPEN]);
          lines = [LineWithAction(line) as (LogicBlockNode | AssignmentsNode | EventsNode)];
        } else {
          lines = [line];
        }
        break;
      case TOKENS.OPTION:
      case TOKENS.STICKY_OPTION:
      case TOKENS.FALLBACK_OPTION:
        lines = [Options()];
        break;
      case TOKENS.DIVERT:
      case TOKENS.DIVERT_PARENT:
        lines = [Divert()];
        break;
      case TOKENS.BRACKET_OPEN:
        consume([ TOKENS.BRACKET_OPEN ]);
        lines = [Variations()];
        break;
      case TOKENS.LINE_BREAK:
        consume([ TOKENS.LINE_BREAK ]);
      case TOKENS.BRACE_OPEN:
        consume([TOKENS.BRACE_OPEN]);
        if (peek([TOKENS.KEYWORD_SET, TOKENS.KEYWORD_TRIGGER])) {
          lines = [LineWithAction() as (LogicBlockNode | AssignmentsNode | EventsNode)];
        } else {
          if (peek([TOKENS.KEYWORD_WHEN])) {
            consume([TOKENS.KEYWORD_WHEN]);
          }
          lines = [ConditionalLine()];
        }
        break;
    }

    if (peek(acceptableNext)) {
      lines = lines.concat(Lines());
    }

    return lines;
  }

  const DialogueLine = (): LineNode | OptionsNode => {
    switch (currentToken.token) {
      case TOKENS.SPEAKER:
        return LineWithSpeaker();
      case TOKENS.TEXT:
        return TextLine();
    }
  };

  const LineWithSpeaker = (): LineNode => {
    const { value } = currentToken;
    consume([TOKENS.TEXT]);
    const line = DialogueLine() as LineNode;
    line.speaker =  value;
    return line;
  }

  const TextLine = (): LineNode | OptionsNode => {
    const { value } = currentToken;
    const next = peek([TOKENS.LINE_ID, TOKENS.TAG]);
    let line: LineNode | OptionsNode;

    if (next) {
      consume([TOKENS.LINE_ID, TOKENS.TAG]);
      line = LineWithMetadata();
      line.value = value;
    } else {
      line = new LineNode(value);
    }

    if (isMultilineEnabled && peek([TOKENS.INDENT])) {
      consume([TOKENS.INDENT]);

      if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.FALLBACK_OPTION])) {
        const options = Options();
        options.id = line.id;
        options.name = line.value;
        options.tags = line.tags;
        line = options;
      } else {
        while (!peek([TOKENS.DEDENT, TOKENS.EOF])) {
          consume([TOKENS.TEXT]);
          const nextLine = TextLine() as LineNode;
          line.value += ` ${nextLine.value}`;
          if (nextLine.id) {
            line.id = nextLine.id;
          }

          if (nextLine.tags) {
            line.tags = nextLine.tags;
          }
        }
        consume([TOKENS.DEDENT, TOKENS.EOF]);
      }
    }

    return line;
  }

  const LineWithMetadata = (): LineNode => {
    switch (currentToken.token) {
      case TOKENS.LINE_ID:
        return LineWithId();
      case TOKENS.TAG:
        return LineWithTags();
    }
  };

  const LineWithId = (): LineNode => {
    const { value } = currentToken;
    const next = peek([TOKENS.TAG]);
    if (next) {
      consume([TOKENS.TAG]);
      const line = LineWithTags();
      line.id = value;
      return line;
    }
    return new LineNode(undefined, undefined, value);
  };

  const LineWithTags = (): LineNode => {
    const { value } = currentToken;
    const next = peek([TOKENS.LINE_ID, TOKENS.TAG]);
    if (next) {
      consume([TOKENS.LINE_ID, TOKENS.TAG]);
      const line = LineWithMetadata();
      if (!line.tags) {
        line.tags = [];
      }
      line.tags.unshift(value);
      return line;
    }
    return new LineNode(undefined, undefined, undefined, [value]);
  };

  const Options = (): OptionsNode => {
    const options = new OptionsNode([]);

    while (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.FALLBACK_OPTION])) {
      options.content.push(Option());
    }

    if (peek([ TOKENS.DEDENT ])) {
      consume([ TOKENS.DEDENT ]);
    }

    return options;
  };

  const optionType = {
    [TOKENS.OPTION]: 'once',
    [TOKENS.STICKY_OPTION]: 'sticky',
    [TOKENS.FALLBACK_OPTION]: 'fallback',
  }

  const Option = (): OptionNode | LogicBlockNode => {
    consume([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.FALLBACK_OPTION])
    const type = optionType[currentToken.token];

    const acceptableNext = [TOKENS.SPEAKER, TOKENS.TEXT, TOKENS.INDENT, TOKENS.ASSIGN, TOKENS.BRACE_OPEN];
    let lines = [];
    let mainItem: any; // TODO define better type
    let includeLabelAsContent = false;
    let root: LogicBlockNode;
    let wrapper: LogicBlockNode;

    consume(acceptableNext);

    if (currentToken.token === TOKENS.ASSIGN) {
      includeLabelAsContent = true;
      consume(acceptableNext);
    }

    if (currentToken.token === TOKENS.BRACE_OPEN) {
      const block = NestedLogicBlocks();
      root = block.root;
      wrapper = block.wrapper;
      consume(acceptableNext);
    }

    switch (currentToken.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
        isMultilineEnabled = false;
        mainItem = DialogueLine();
        isMultilineEnabled = true;
        if (includeLabelAsContent) {
          lines.push(mainItem);
        }

    }

    if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      const block = NestedLogicBlocks();

      if (!root) {
        root = block.root;
        wrapper = block.wrapper;
      } else {
        wrapper.content = block.wrapper;
        wrapper = block.wrapper;
      }

      consume([TOKENS.LINE_BREAK]);
    }

    if (currentToken.token === TOKENS.INDENT || peek([TOKENS.INDENT])) {
      if (currentToken.token !== TOKENS.INDENT) {
        consume([TOKENS.INDENT])
      }

      lines = lines.concat(Lines());
      if (!mainItem) {
        mainItem = lines[0];
      }
      consume([TOKENS.DEDENT, TOKENS.EOF])
    }

    const node = new OptionNode(
      new ContentNode(lines),
      type,
      mainItem.value,
      mainItem.id,
      mainItem.speaker,
      mainItem.tags,
    );

    if (root) {
      wrapper.content = node;
      return root;
    }

    return node;
  }

  const NestedLogicBlocks = (): NestedLogicBlocks => {
    let root: LogicBlockNode;
    let wrapper: LogicBlockNode;
    while (currentToken.token === TOKENS.BRACE_OPEN) {
      if (!root) {
        root = LogicBlock();
        wrapper = root;
      } else {
        let next = LogicBlock();
        wrapper.content = next;
        wrapper = next;
      }
      if (peek([TOKENS.BRACE_OPEN])) {
        consume([TOKENS.BRACE_OPEN]);
      }
    }
    return { root, wrapper };
  };

  const Divert = (): DivertNode | LogicBlockNode => {
    consume([ TOKENS.DIVERT, TOKENS.DIVERT_PARENT ]);
    const divert = currentToken;
    let token: DivertNode | LogicBlockNode;

    switch (divert.token) {
      case TOKENS.DIVERT:
        token = new DivertNode(divert.value);
        break;
      case TOKENS.DIVERT_PARENT:
        token = new DivertNode('<parent>');
        break;
    }

    if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      return token;
    }

    if (peek([TOKENS.EOF])) {
      return token;
    }

    if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      token = LineWithAction(token) as LogicBlockNode;
    }

    return token
  };

  const Variations = (): VariationsNode => {
    const variations = new VariationsNode('cycle');

    if (peek([TOKENS.VARIATIONS_MODE])) {
      const mode = consume([TOKENS.VARIATIONS_MODE]);
      if (!variationsModes.includes(mode.value)) {
        throw new Error(`Wrong variation mode set "${mode.value}". Valid modes: ${variationsModes.join(', ')}.`);
      };
      variations.mode = mode.value;
    }

    while(peek([TOKENS.INDENT, TOKENS.MINUS])) {
      if (peek([TOKENS.INDENT])) {
        consume([TOKENS.INDENT]);
        continue;
      }
      consume([TOKENS.MINUS])

      let startsNextLine = false;
      if (peek([TOKENS.INDENT])) {
        consume([TOKENS.INDENT]);
        startsNextLine = true;
      }

      variations.content.push(new ContentNode(Lines()));
      if (startsNextLine) {
        const lastVariation = variations.content[variations.content.length - 1].content;
        const lastContent = lastVariation[lastVariation.length - 1];
        if (lastContent.type !== 'options') {
          consume([TOKENS.DEDENT]);
        }
      }

      if (peek([TOKENS.DEDENT])) {
        consume([TOKENS.DEDENT]);
      }
    }
    consume([TOKENS.BRACKET_CLOSE]);

    return variations;
  };

  const LineWithAction = (line?: LineNode | OptionsNode | LogicBlockNode | DivertNode): LogicBlockNode | AssignmentsNode | OperandNode | EventsNode => {
    const token = peek([
      TOKENS.KEYWORD_SET,
      TOKENS.KEYWORD_TRIGGER,
    ]);
    const expression = LogicElement();

    if (line) {
      let content = line;

      if (peek([TOKENS.BRACE_OPEN])) {
        consume([TOKENS.BRACE_OPEN]);
        content = LineWithAction(line) as LogicBlockNode;
      }

      if (peek([TOKENS.LINE_BREAK])) {
        consume([TOKENS.LINE_BREAK]);
      }

      if (!token || token.token === TOKENS.KEYWORD_WHEN) {
        return new ConditionalContentNode(expression as OperandNode, content);
      }
      return new ActionContentNode(expression as (EventsNode | AssignmentsNode), content);
    }

    if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      return expression;
    }

    if (peek([TOKENS.EOF])) {
      return  expression;
    }

    if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      if (!token) {
        return new ConditionalContentNode(expression as OperandNode, LineWithAction());
      }
      return new ActionContentNode(expression as (EventsNode | AssignmentsNode), LineWithAction());
    }

    consume([TOKENS.SPEAKER, TOKENS.TEXT]);

    if (!token) {
      return new ConditionalContentNode(expression as OperandNode, DialogueLine());
    }
    return new ActionContentNode(expression as (EventsNode | AssignmentsNode), DialogueLine());
  };

  const LogicElement = (): AssignmentsNode | EventsNode | OperandNode => {
    if (peek([TOKENS.KEYWORD_SET])) {
      const assignments = Assignments()
      return assignments
    }

    if (peek([TOKENS.KEYWORD_TRIGGER])) {
      const events = Events();
      return events;

    }

    if (peek([TOKENS.KEYWORD_WHEN])) {
      consume([TOKENS.KEYWORD_WHEN]);
    }

    const condition = Condition();
    return condition;
  };

  const LogicBlock = (): LogicBlockNode => {
    if (peek([TOKENS.KEYWORD_SET])) {
      const assignments = Assignments()
      return new ActionContentNode(assignments);
    }

    if (peek([TOKENS.KEYWORD_TRIGGER])) {
      const events = Events();
      return new ActionContentNode(events);

    }

    if (peek([TOKENS.KEYWORD_WHEN])) {
      consume([TOKENS.KEYWORD_WHEN]);
    }

    const condition = Condition();
    return new ConditionalContentNode(condition);
  };


  const Assignments = (): AssignmentsNode => {
    consume([TOKENS.KEYWORD_SET]);
    const assignments = [AssignmentExpression()];
    while(peek([TOKENS.COMMA])) {
      consume([TOKENS.COMMA]);
      assignments.push(AssignmentExpression());
    }
    consume([TOKENS.BRACE_CLOSE]);
    return new AssignmentsNode(assignments);
  };

  const Events = (): EventsNode => {
    consume([TOKENS.KEYWORD_TRIGGER]);
    consume([TOKENS.IDENTIFIER]);
    const events = [new EventNode(currentToken.value)];

    while(peek([TOKENS.COMMA])) {
      consume([TOKENS.COMMA]);
      consume([TOKENS.IDENTIFIER]);
      events.push(new EventNode(currentToken.value));
    }

    consume([TOKENS.BRACE_CLOSE]);

    return new EventsNode(events);
  };

  const ConditionalLine = (): ConditionalContentNode => {
    const expression = Condition();

    let content: ContentNode | LineNode | OptionsNode | DivertNode | LogicBlockNode | AssignmentsNode | EventsNode;

    if (peek([TOKENS.DIVERT, TOKENS.DIVERT_PARENT])) {
      content = Divert();
    } else if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      consume([TOKENS.INDENT]);
      content = new ContentNode(Lines());
      consume([TOKENS.DEDENT, TOKENS.EOF]);
    } else if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      content = LineWithAction() as (LogicBlockNode | AssignmentsNode | EventsNode);
    } else {
      consume([TOKENS.SPEAKER, TOKENS.TEXT]);
      content = DialogueLine();
      if (peek([TOKENS.BRACE_OPEN])) {
        consume([TOKENS.BRACE_OPEN]);
        content = LineWithAction(content) as (LogicBlockNode | AssignmentsNode | EventsNode);
      }
    }

    return new ConditionalContentNode(
      expression,
      content
    );
  };

  const Condition = (): OperandNode => {
    const token = peek([
      TOKENS.IDENTIFIER,
      TOKENS.NOT,
    ]);
    let expression: OperandNode;
    if (token) {
      expression = Expression();
    }
    consume([TOKENS.BRACE_CLOSE]);
    return expression;
  };

  const AssignmentExpression = (): AssignmentNode | VariableNode => {
    consume([TOKENS.IDENTIFIER]);
    const variable = new VariableNode(currentToken.value);

    if (peek([TOKENS.BRACE_CLOSE])) {
      // TODO make a true boolean assignment to solve scenario where { set banana }
      return variable;
    }

    const operators = Object.keys(assignmentOperators);

    consume(operators);

    if (peek([TOKENS.IDENTIFIER]) && peek([...operators, TOKENS.BRACE_CLOSE], 1)) {
      return new AssignmentNode(variable, assignmentOperators[currentToken.token], AssignmentExpression());
    }
    return new AssignmentNode(variable, assignmentOperators[currentToken.token], Expression());
  };

  const Expression = (minPrecedence = 1): OperandNode => {
    const operatorTokens = Object.keys(operators);

    let lhs = Operand();

    if (!peek(operatorTokens)) {
      return lhs;
    }

    consume(operatorTokens);

    while (true) {
      if (!operatorTokens.includes(currentToken.token)) {
        break;
      }

      const operator = currentToken.token;

      const { precedence, associative } = operators[currentToken.token];

      if (precedence < minPrecedence) {
        break;
      }

      const nextMinPrecedence = associative === 'LEFT' ? precedence + 1 : precedence;
      const rhs = Expression(nextMinPrecedence);
      lhs = Operator(operator, lhs, rhs);
    }
    return lhs;
  };

  const Operand = (): OperandNode | undefined => {
    consume([
      TOKENS.IDENTIFIER,
      TOKENS.NOT,
      TOKENS.NUMBER_LITERAL,
      TOKENS.STRING_LITERAL,
      TOKENS.BOOLEAN_LITERAL,
      TOKENS.NULL_TOKEN
    ]);

    switch(currentToken.token) {
      case TOKENS.NOT:
        return new ExpressionNode('not', [Operand()]);
      case TOKENS.IDENTIFIER:
        return new VariableNode(currentToken.value);
      case TOKENS.NUMBER_LITERAL:
        return NumberLiteralNode.create(currentToken.value);
      case TOKENS.STRING_LITERAL:
        return StringLiteralNode.create(currentToken.value);
      case TOKENS.BOOLEAN_LITERAL:
        return BooleanLiteralNode.create(currentToken.value);
      case TOKENS.NULL_TOKEN:
        return new NullTokenNode();
    }
  };

  const Operator = (operator: string, lhs: OperandNode, rhs: OperandNode): ExpressionNode => {
    const labels = {
      [TOKENS.PLUS]: 'add',
      [TOKENS.MINUS]: 'sub',
      [TOKENS.MULT]: 'mult',
      [TOKENS.DIV]: 'div',
      [TOKENS.MOD]: 'mod',
      [TOKENS.POWER]: 'pow',
      [TOKENS.AND]: 'and',
      [TOKENS.OR]: 'or',
      [TOKENS.EQUAL]: 'equal',
      [TOKENS.NOT_EQUAL]: 'not_equal',
      [TOKENS.GREATER]: 'greater_than',
      [TOKENS.LESS]: 'less_than',
      [TOKENS.GE]: 'greater_or_equal',
      [TOKENS.LE]: 'less_or_equal',
    };
    return new ExpressionNode(labels[operator], [lhs, rhs]);
  };

  const result = Document();
  if (peek()) {
    consume([ TOKENS.EOF ]);
  }
  return result;
}
