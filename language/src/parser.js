import { TOKENS, tokenize, getTokenFriendlyHint } from './lexer.js';

import {
  DocumentNode,
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
} from './nodes.js';

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

export default function parse(doc) {
  const tokens = tokenize(doc);
  // const test = tokenize(doc);
  // console.log(test.getAll());
  let currentToken;
  let lookahead = undefined;
  let isMultilineEnabled = true;

  const wrongTokenError = (token, expected) => {
    throw new Error(`Unexpected token "${getTokenFriendlyHint(token.token)}" on line ${token.line+1} column ${token.column+1}. Expected ${expected.map(getTokenFriendlyHint).join(', ')} `);
  }

  const consume = (expected) => {
    if (!lookahead) {
      lookahead = tokens.next();
    }
    if (expected && (!lookahead || !expected.includes(lookahead.token))) {
      wrongTokenError(lookahead || {}, expected);
    }
    currentToken = lookahead;
    lookahead = undefined;
    return currentToken;
  };

  const peek = (expected) => {
    if (!lookahead) {
      lookahead = tokens.next();
    }

    if (!expected || (lookahead && expected.includes(lookahead.token))) {
      return lookahead;
    }
  };

  const Document = () => {
    const expected = [
      TOKENS.EOF,
      TOKENS.SPEAKER,
      TOKENS.TEXT,
      TOKENS.OPTION,
      TOKENS.STICKY_OPTION,
      TOKENS.DIVERT,
      TOKENS.DIVERT_PARENT,
      TOKENS.BRACKET_OPEN,
      TOKENS.BRACE_OPEN,
    ];
    const next = peek();

    switch (next.token) {
      case TOKENS.EOF:
        return DocumentNode();
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
      case TOKENS.OPTION:
      case TOKENS.STICKY_OPTION:
      case TOKENS.DIVERT:
      case TOKENS.DIVERT_PARENT:
      case TOKENS.BRACKET_OPEN:
      case TOKENS.BRACE_OPEN:
      case TOKENS.LINE_BREAK:
        const result =  DocumentNode([ContentNode(Lines())]);
        if (peek([TOKENS.BLOCK])) {
          result.blocks = Blocks();
        }
        return result;
      case TOKENS.BLOCK:
        return DocumentNode([], Blocks());
      default:
        wrongTokenError(next, expected);
    };
  };

  const Blocks = () => {
    consume([TOKENS.BLOCK]);
    let blocks =  [
      BlockNode(currentToken.value, ContentNode(Lines()))
    ];

    while (peek([TOKENS.BLOCK])) {
      blocks = blocks.concat(Blocks());
    }

    return blocks;
  };

  const Lines = () => {
    const acceptableNext = [
      TOKENS.SPEAKER,
      TOKENS.TEXT,
      TOKENS.OPTION,
      TOKENS.STICKY_OPTION,
      TOKENS.DIVERT,
      TOKENS.DIVERT_PARENT,
      TOKENS.BRACKET_OPEN,
      TOKENS.BRACE_OPEN,
      TOKENS.LINE_BREAK,
    ];
    let lines;
    const tk = peek(acceptableNext);
    switch (tk.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
        consume([ TOKENS.SPEAKER, TOKENS.TEXT ]);
        const line = Line();
        if (peek(TOKENS.BRACE_OPEN)) {
          consume([TOKENS.BRACE_OPEN]);
          lines = [LineWithAction(line)];
        } else {
          lines = [line];
        }
        break;
      case TOKENS.OPTION:
      case TOKENS.STICKY_OPTION:
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
          lines = [LineWithAction()];
        } else {
          lines = [ConditionalLine()];
        }
        break;
    }

    if (peek(acceptableNext)) {
      lines = lines.concat(Lines());
    }

    return lines;
  }

  const Line = () => {
    return DialogueLine();
  };

  const DialogueLine = () => {
    switch (currentToken.token) {
      case TOKENS.SPEAKER:
        return LineWithSpeaker();
      case TOKENS.TEXT:
        return TextLine();
    }
  };

  const LineWithSpeaker = () => {
    const { value } = currentToken;
    consume([TOKENS.TEXT]);
    const line = DialogueLine();
    line.speaker =  value;
    return line;
  }

  const TextLine = () => {
    const { value } = currentToken;
    const next = peek([TOKENS.LINE_ID, TOKENS.TAG]);
    let line;

    if (next) {
      consume([TOKENS.LINE_ID, TOKENS.TAG]);
      line = LineWithMetadata();
      line.value = value;
    } else {
      line = LineNode(value);
    }

    if (isMultilineEnabled && peek([TOKENS.INDENT])) {
      consume([TOKENS.INDENT]);

      if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
        const options = Options();
        options.id = line.id;
        options.name = line.value;
        options.tags = line.tags;
        line = options;
      } else {
        while (!peek([TOKENS.DEDENT, TOKENS.EOF])) {
          consume([TOKENS.TEXT]);
          const nextLine = TextLine();
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

  const LineWithMetadata = () => {
    switch (currentToken.token) {
      case TOKENS.LINE_ID:
        return LineWithId();
      case TOKENS.TAG:
        return LineWithTags();
    }
  };

  const LineWithId = () => {
    const { value } = currentToken;
    const next = peek([TOKENS.TAG]);
    if (next) {
      consume([TOKENS.TAG]);
      const line = LineWithTags();
      line.id = value;
      return line;
    }
    return LineNode(undefined, undefined, value);
  };

  const LineWithTags = () => {
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
    return LineNode(undefined, undefined, undefined, [value]);
  };

  const Options = (firstElement) => {
    const options = OptionsNode(
      [firstElement || Option()]
    );

    while (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.LINE_BREAK])) {
      if (peek([TOKENS.LINE_BREAK])) {
        consume([TOKENS.LINE_BREAK]);
        consume([TOKENS.BRACE_OPEN]);
        options.content.push(LogicBlock(() => Option()));
      } else {
        const option = Option();
        if (peek([TOKENS.BRACE_OPEN])) {
          consume([TOKENS.BRACE_OPEN]);
          options.content.push(LogicBlock(() => option));
          consume([TOKENS.LINE_BREAK]);
        } else {
          options.content.push(option);
        }
      }
    }

    if (peek([ TOKENS.DEDENT ])) {
      consume([ TOKENS.DEDENT ]);
    }

    return options;
  };

  const Option = () => {
    consume([TOKENS.OPTION, TOKENS.STICKY_OPTION])
    const type = currentToken.token == TOKENS.OPTION ? 'once' : 'sticky';
    const acceptableNext = [TOKENS.SPEAKER, TOKENS.TEXT, TOKENS.INDENT, TOKENS.SQR_BRACKET_OPEN];
    let lines = [];
    let mainItem;
    let useFirstLineAsDisplayOnly = false;

    consume(acceptableNext);

    if (currentToken.token === TOKENS.SQR_BRACKET_OPEN) {
      useFirstLineAsDisplayOnly = true;
      consume(acceptableNext);
    }

    switch (currentToken.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
        isMultilineEnabled = false;
        mainItem = Line();
        isMultilineEnabled = true;
        if (useFirstLineAsDisplayOnly) {
          consume([TOKENS.SQR_BRACKET_CLOSE]);
        } else {
          lines.push(mainItem);
        }

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

    return OptionNode(
      ContentNode(lines),
      type,
      mainItem.value,
      mainItem.id,
      mainItem.speaker,
      mainItem.tags,
    );
  }

  const Divert = () => {
    consume([ TOKENS.DIVERT, TOKENS.DIVERT_PARENT ]);
    const divert = currentToken;

    switch (divert.token) {
      case TOKENS.DIVERT:
        return DivertNode(divert.value);
      case TOKENS.DIVERT_PARENT:
        return DivertNode('<parent>');
    }
  };

  const Variations = () => {
    const variations = VariationsNode('sequence');

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

      variations.content.push(ContentNode(Lines()));
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

  const LineWithAction = (line) => {
    const token = peek([
      TOKENS.KEYWORD_SET,
      TOKENS.KEYWORD_TRIGGER,
      TOKENS.KEYWORD_WHEN
    ]);
    const expression = LogicElement();

    if (line) {
      let content = line;

      if (peek([TOKENS.BRACE_OPEN])) {
        consume([TOKENS.BRACE_OPEN]);
        content = LineWithAction(line);
      }

      if (peek([TOKENS.LINE_BREAK])) {
        consume([TOKENS.LINE_BREAK]);
      }

      if (!token || token.token === TOKENS.KEYWORD_WHEN) {
        return ConditionalContentNode(expression, content);
      }
      return ActionContentNode(expression, content);
    }

    if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      return expression;
    }

    if (peek([TOKENS.EOF])) {
      return  expression;
    }

    if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
      return Options(ActionContentNode(expression, Option()));
    }

    if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      return ActionContentNode(expression, LineWithAction());
    }

    consume([TOKENS.SPEAKER, TOKENS.TEXT]);

    return ActionContentNode(
      expression,
      Line()
    );
  };

  const LogicElement = () => {
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

  const LogicBlock = (content) => {
    if (peek([TOKENS.KEYWORD_SET])) {
      const assignments = Assignments()
      return ActionContentNode(assignments, content());
    }

    if (peek([TOKENS.KEYWORD_TRIGGER])) {
      const events = Events();
      return ActionContentNode(events, content());

    }

    if (peek([TOKENS.KEYWORD_WHEN])) {
      consume([TOKENS.KEYWORD_WHEN]);
    }

    const condition = Condition();
    return ConditionalContentNode(condition, content());
  };


  const Assignments = () => {
    consume([TOKENS.KEYWORD_SET]);
    const assignments = [AssignmentExpression()];
    while(peek([TOKENS.COMMA])) {
      consume([TOKENS.COMMA]);
      assignments.push(AssignmentExpression());
    }
    consume([TOKENS.BRACE_CLOSE]);
    return AssignmentsNode(assignments);
  };

  const Events = () => {
    consume([TOKENS.KEYWORD_TRIGGER]);
    consume([TOKENS.IDENTIFIER]);
    const events = [EventNode(currentToken.value)];

    while(peek([TOKENS.COMMA])) {
      consume([TOKENS.COMMA]);
      consume([TOKENS.IDENTIFIER]);
      events.push(EventNode(currentToken.value));
    }

    consume([TOKENS.BRACE_CLOSE]);

    return EventsNode(events);
  };

  const ConditionalLine = () => {
    const expression = Condition();

    let content;

    if (peek([TOKENS.DIVERT, TOKENS.DIVERT_PARENT])) {
      content = Divert();
    } else if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
      return Options(ConditionalContentNode(expression, Option()));
    } else if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      consume([TOKENS.INDENT]);
      content = ContentNode(Lines());
      consume([TOKENS.DEDENT, TOKENS.EOF]);
    } else if (peek([TOKENS.BRACE_OPEN])) {
      consume([TOKENS.BRACE_OPEN]);
      content = LineWithAction();
    } else {
      consume([TOKENS.SPEAKER, TOKENS.TEXT]);
      content = Line();
      if (peek([TOKENS.BRACE_OPEN])) {
        consume([TOKENS.BRACE_OPEN]);
        content = LineWithAction(content);
      }
    }

    return ConditionalContentNode(
      expression,
      content
    );
  };

  const Condition = () => {
    const token = peek([
      TOKENS.IDENTIFIER,
      TOKENS.NOT,
    ]);
    let expression;
    if (token) {
      expression = Expression();
    }
    consume([TOKENS.BRACE_CLOSE]);
    return expression;
  };

  const AssignmentExpression = () => {
    consume([TOKENS.IDENTIFIER]);
    const variable = VariableNode(currentToken.value);

    if (peek([TOKENS.BRACE_CLOSE])) {
      return variable;
    }

    consume(Object.keys(assignmentOperators));

    if (peek([TOKENS.IDENTIFIER])) {
      return AssignmentNode(variable, assignmentOperators[currentToken.token], AssignmentExpression());
    }
    return AssignmentNode(variable, assignmentOperators[currentToken.token], Expression());
  };

  const Expression = (minPrecedence = 1) => {
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

  const Operand = () => {
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
        return ExpressionNode('not', [Operand()]);
      case TOKENS.IDENTIFIER:
        return VariableNode(currentToken.value);
      case TOKENS.NUMBER_LITERAL:
        return NumberLiteralNode(currentToken.value);
      case TOKENS.STRING_LITERAL:
        return StringLiteralNode(currentToken.value);
      case TOKENS.BOOLEAN_LITERAL:
        return BooleanLiteralNode(currentToken.value);
      case TOKENS.NULL_TOKEN:
        return NullTokenNode();
    }
  };

  const Operator = (operator, lhs, rhs) => {
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
    return ExpressionNode(labels[operator], [lhs, rhs]);
  };

  const result = Document();
  if (peek()) {
    consume([ TOKENS.EOF ]);
  }
  return result;
}
