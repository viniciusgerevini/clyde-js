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

export default function parse(doc) {
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
      case TOKENS.QUOTE:
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
      TOKENS.QUOTE,
      TOKENS.OPTION,
      TOKENS.STICKY_OPTION,
      TOKENS.DIVERT,
      TOKENS.DIVERT_PARENT,
      TOKENS.BRACKET_OPEN,
      TOKENS.BRACE_OPEN,
      TOKENS.LINE_BREAK,
    ];
    let lines;
    consume(acceptableNext);
    switch (currentToken.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
      case TOKENS.QUOTE:
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
        lines = [Variations()];
        break;
      case TOKENS.LINE_BREAK:
        consume([TOKENS.BRACE_OPEN]);
      case TOKENS.BRACE_OPEN:
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
    switch (currentToken.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
        return DialogueLine();
      case TOKENS.QUOTE:
        return LineInQuotes();
    }
  };

  const LineInQuotes = () => {
    const acceptableNext = [TOKENS.TEXT, TOKENS.QUOTE];
    let line;
    consume(acceptableNext);

    switch (currentToken.token) {
      case TOKENS.TEXT:
        line= LineNode(currentToken.value);
        consume([TOKENS.QUOTE]);
      case TOKENS.QUOTE:
        const value = line.value;
        const next = peek([TOKENS.LINE_ID, TOKENS.TAG]);
        if (next) {
          consume([TOKENS.LINE_ID, TOKENS.TAG]);
          line = LineWithMetadata();
          line.value = value;
        } else {
          line = LineNode(value);
        }
        break;
    }

    if (peek([TOKENS.INDENT])) {
      consume([TOKENS.INDENT]);
      consume([TOKENS.OPTION, TOKENS.STICKY_OPTION])
      const options = Options();
      options.id = line.id;
      options.name = line.value;
      options.tags = line.tags;
      line = options;
    }

    return line;
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
        consume([TOKENS.OPTION, TOKENS.STICKY_OPTION])
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
      consume([TOKENS.OPTION, TOKENS.STICKY_OPTION, TOKENS.LINE_BREAK]);
      if (currentToken.token === TOKENS.LINE_BREAK) {
        consume([TOKENS.BRACE_OPEN]);

        if (peek([TOKENS.KEYWORD_SET])) {
          const assignments = Assignments()
          consume([TOKENS.BRACE_CLOSE]);
          consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
          options.content.push(ActionContentNode(assignments, Option()));
        } else if (peek([TOKENS.KEYWORD_TRIGGER])) {
          const events = Events();
          consume([TOKENS.BRACE_CLOSE]);
          consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
          options.content.push(ActionContentNode(events, Option()));
        } else {
          const condition = Condition();
          consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
          options.content.push(ConditionalContentNode(condition, Option()));
        }
      } else {
        const option = Option();
        if (peek([TOKENS.BRACE_OPEN])) {
          consume([TOKENS.BRACE_OPEN]);
          if (peek([TOKENS.KEYWORD_SET])) {
            options.content.push(ActionContentNode(Assignments(), option));
            consume([TOKENS.BRACE_CLOSE]);
          } else if (peek([TOKENS.KEYWORD_TRIGGER])) {
            options.content.push(ActionContentNode(Events(), option));
            consume([TOKENS.BRACE_CLOSE]);
          } else {
            consume([TOKENS.KEYWORD_WHEN]);
            options.content.push(ConditionalContentNode(Condition(), option));
          }
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
    const type = currentToken.token == TOKENS.OPTION ? 'once' : 'sticky';
    const acceptableNext = [TOKENS.SPEAKER, TOKENS.TEXT, TOKENS.QUOTE, TOKENS.INDENT, TOKENS.SQR_BRACKET_OPEN];
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
      case TOKENS.QUOTE:
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
        consume([TOKENS.DEDENT]);
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
    ]) || {};

    let expression;
    switch(token.token) {
      case TOKENS.KEYWORD_SET:
        expression = Assignments();
        break;
      case TOKENS.KEYWORD_TRIGGER:
        expression = Events();
        break;
      case TOKENS.KEYWORD_WHEN:
        consume([TOKENS.KEYWORD_WHEN]);
        return ConditionalLine(line);
    }

    consume([TOKENS.BRACE_CLOSE]);

    if (line) {
      return ActionContentNode(
        expression,
        line
      );
    }

    if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      return expression;
    }

    if (peek([TOKENS.EOF])) {
      return  expression;
    }

    if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
      consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
      return Options(ActionContentNode(expression, Option()));
    }

    consume([TOKENS.SPEAKER, TOKENS.TEXT, TOKENS.QUOTE,]);

    return ActionContentNode(
      expression,
      Line()
    );
  };

  const Assignments = () => {
    consume([TOKENS.KEYWORD_SET]);
    const assignments = [AssignmentExpression()];
    while(peek([TOKENS.COMMA])) {
      consume([TOKENS.COMMA]);
      assignments.push(AssignmentExpression());
    }
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

    return EventsNode(events);
  };

  const ConditionalLine = (line) => {
    const expression = Condition();

    if (line) {
      return ConditionalContentNode(
        expression,
        line
      );
    }

    let content;

    if (peek([TOKENS.DIVERT, TOKENS.DIVERT_PARENT])) {
      consume([TOKENS.DIVERT, TOKENS.DIVERT_PARENT]);
      content = Divert();
    } else if (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
      consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
      return Options(ConditionalContentNode(expression, Option()));
    } else if (peek([TOKENS.LINE_BREAK])) {
      consume([TOKENS.LINE_BREAK]);
      consume([TOKENS.INDENT]);
      content = ContentNode(Lines());
      consume([TOKENS.DEDENT, TOKENS.EOF]);
    } else {
      consume([TOKENS.SPEAKER, TOKENS.TEXT, TOKENS.QUOTE,]);
      content = Line();
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
