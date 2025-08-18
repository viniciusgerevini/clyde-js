export const TOKENS = {
  TEXT: 'TEXT',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  OPTION: 'OPTION',
  STICKY_OPTION: 'STICKY_OPTION',
  FALLBACK_OPTION: 'FALLBACK_OPTION',
  BRACKET_OPEN: 'BRACKET_OPEN',
  BRACKET_CLOSE: 'BRACKET_CLOSE',
  EOF: 'EOF',
  SPEAKER: 'SPEAKER',
  LINE_ID: 'LINE_ID',
  TAG: 'TAG',
  ID_SUFFIX: 'ID_SUFFIX',
  BLOCK: 'BLOCK',
  DIVERT: 'DIVERT',
  DIVERT_PARENT: 'DIVERT_PARENT',
  VARIATIONS_MODE: 'VARIATIONS_MODE',
  MINUS: '-',
  PLUS: '+',
  MULT: '*',
  DIV: '/',
  POWER: '^',
  MOD: '%',
  BRACE_OPEN: '{',
  BRACE_CLOSE: '}',
  AND: 'AND',
  OR: 'OR',
  NOT:'NOT',
  EQUAL: '==, is',
  NOT_EQUAL: '!=, isnt',
  GE: '>=',
  LE: '<=',
  GREATER: 'GREATER',
  LESS: 'LESS',
  NUMBER_LITERAL: 'number',
  NULL_TOKEN: 'null',
  BOOLEAN_LITERAL: 'boolean',
  STRING_LITERAL: 'string',
  IDENTIFIER: 'identifier',
  KEYWORD_SET: 'set',
  KEYWORD_TRIGGER: 'trigger',
  KEYWORD_WHEN: 'when',
  KEYWORD_MATCH: 'match',
  KEYWORD_ELSE: 'else',
  KEYWORD_THEN: 'then',
  ASSIGN: '=',
  ASSIGN_SUM: '+=',
  ASSIGN_SUB: '-=',
  ASSIGN_DIV: '/=',
  ASSIGN_MULT: '*=',
  ASSIGN_POW: '^=',
  ASSIGN_MOD: '%=',
  ASSIGN_INIT: '?=',
  COMMA: ',',
  LINE_BREAK: 'line break',
  LINK_FILE: 'link file',
}

enum LexerMode {
  DEFAULT,
  OPTION,
  QSTRING,
  LOGIC,
  VARIATIONS,
  MATCH,
  MATCH_BODY,
};

const tokenFriendlyHint = {
  [TOKENS.TEXT]: 'text',
  [TOKENS.INDENT]: 'INDENT',
  [TOKENS.DEDENT]: 'DEDENT',
  [TOKENS.OPTION]: '*',
  [TOKENS.STICKY_OPTION]: '+',
  [TOKENS.FALLBACK_OPTION]: '>',
  [TOKENS.BRACKET_OPEN]: '(',
  [TOKENS.BRACKET_CLOSE]: ')',
  [TOKENS.EOF]: 'EOF',
  [TOKENS.SPEAKER]: '<speaker name>:',
  [TOKENS.LINE_ID]: '$id',
  [TOKENS.TAG]: '#tag',
  [TOKENS.ID_SUFFIX]: '&id_suffix',
  [TOKENS.BLOCK]: '== <block name>',
  [TOKENS.DIVERT]: '-> <target name>',
  [TOKENS.DIVERT_PARENT]: '<-',
  [TOKENS.VARIATIONS_MODE]: '<variations mode>',
  [TOKENS.BRACE_OPEN]: '{',
  [TOKENS.BRACE_CLOSE]: '}',
  [TOKENS.AND]: '&&, and',
  [TOKENS.OR]: '||, or',
  [TOKENS.NOT]:' not, !',
  [TOKENS.EQUAL]: '==, is',
  [TOKENS.NOT_EQUAL]: '!=, isnt',
  [TOKENS.GE]: '>=',
  [TOKENS.LE]: '<=',
  [TOKENS.GREATER]: '>',
  [TOKENS.LESS]: '<',
  [TOKENS.LINK_FILE]: '@link <import> | <import_name> = <import_path>',
}

type OptionType = '*' | '+' | '>';

const optionTypes = {
  '*': TOKENS.OPTION,
  '+': TOKENS.STICKY_OPTION,
  '>': TOKENS.FALLBACK_OPTION,
};

export type Token = {
  token: string;
  value?: string;
  line: number;
  column: number;
};

interface TokenList {
  getAll(): Token[];
  next(): Token;
}

export type TokenHandlerReturn = Token | Token[] | void;

export function getTokenFriendlyHint(token: string): string {
  const hint = tokenFriendlyHint[token];
  if (!hint) {
    return token;
  }
  return hint;
}

export function tokenize(input: string): TokenList {
  let indent = [0];
  let position = 0;
  let line = 0;
  let column = 0;
  let length = input.length;
  let pendingTokens: Token[] = [];
  const modes = [
    LexerMode.DEFAULT
  ];
  let currentQuote: string | null = null;

  const stackMode = (mode: LexerMode) => {
    modes.unshift(mode);
  };

  const popMode = () => {
    if (modes.length > 1) {
      modes.shift();
    }
  };

  const matchBodyIndent: number[] = [];

  const isCurrentMode = (mode: LexerMode): boolean => {
    return modes[0] === mode;
  };

  const checkSequence = (string: string, initialPosition: number, value: string): boolean => {
    const sequence = string.slice(initialPosition, initialPosition + value.length);
    return sequence === value;
  };

  // handle indentation
  const handleIndent = (): TokenHandlerReturn => {
    let initialLine = line;

    let indentation = 0;
    while (input[position] && input[position].match(/[\t ]/)) {
      indentation += 1;
      position += 1;
    }
    if (indentation > indent[0]) {
        const previousIndent = indent[0];
        column += indentation;
        indent.unshift(indentation);

        if (isCurrentMode(LexerMode.MATCH_BODY)) {
          matchBodyIndent.push(previousIndent);
        }

        return { token: TOKENS.INDENT, line: initialLine, column: previousIndent };
    }

    if (indentation === indent[0]) {
      column = indent[0]
      return;
    }

    let tokens = [];
    while (indentation < indent[0]) {
        indent.shift();
        column = indent[0];
        tokens.push({ token: TOKENS.DEDENT, line, column });

        if (isMatchBodyIndentLevel(column)) {
          popMode();
          matchBodyIndent.shift();
        }
    }

    return tokens;
  };

  const isMatchBodyIndentLevel = (currentIndent: number): boolean => (
    isCurrentMode(LexerMode.MATCH_BODY) &&
    matchBodyIndent[matchBodyIndent.length - 1] === currentIndent
  );

  // handle comments
  const handleComments = (): void => {
    while (input[position] && input[position] !== '\n') {
      position += 1;
    }
    position += 1;
    line += 1;
  };

  // handle line breaks
  const handleLineBreaks = (): void => {
    while (input[position] === '\n') {
      line += 1;
      position += 1;
      column = 0;
    }

    if (isCurrentMode(LexerMode.OPTION)) {
      popMode();
    }
  };

  // handle spaces
  const handleSpace = (): void => {
    while (input[position] === ' ') {
      position += 1;
      column += 1;
    }
  };

  const handleRogueTab = (): void => {
    while (input[position].match(/\t/)) {
      position += 1;
      column += 1;
    }
  };

  // handle text
  const handleText = (): TokenHandlerReturn => {
    const initialLine = line;
    const initialColumn = column;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];

      if (['\n', '$', '#', '{' ].includes(currentChar)) {
        break;
      }

      if (currentChar === '\\' && input[position + 1] !== 'n') {
        value.push(input[position + 1]);
        position += 2;
        column += 2;
        continue;
      }

      if (currentChar === ':') {
        position += 1;
        column += 1;
        return { token: TOKENS.SPEAKER, line: initialLine, column: initialColumn, value: value.join('').trim() };
      }

      value.push(currentChar);

      position += 1;
      column += 1;
    }

    return { token: TOKENS.TEXT, line: initialLine, column: initialColumn, value: value.join('').trim() };
  };

  // handle text in quotes
  const handleQText = () => {
    const initialLine = line;
    const initialColumn = column;
    let value = [];

    while (position < input.length) {
      const currentChar = input[position];

      if (currentChar === currentQuote) {
        break;
      }

      if (currentChar === '\\' && input[position + 1] === currentQuote) {
        value.push(input[position + 1]);
        position += 2;
        column += 2;
        continue;
      }

      if (currentChar === '\n') {
        line += 1;
      }

      value.push(currentChar);

      position += 1;
      column += 1;
    }


    return { token: TOKENS.TEXT, line: initialLine, column: initialColumn, value: value.join('').trim() };
  };

  // handle quote
  const handleQuote = (): void => {
    column += 1;
    position += 1;
    if (isCurrentMode(LexerMode.QSTRING)) {
      currentQuote = null;
      popMode();
    } else {
      stackMode(LexerMode.QSTRING);
    }
  };

  // handle options
  const handleOption = () => {
    const token = optionTypes[input[position] as OptionType];

    const initialColumn = column;
    column += 1;
    position += 1;
    stackMode(LexerMode.OPTION);
    return { token, line, column: initialColumn };
  };

  const handleOptionDisplayChar = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    return { token: TOKENS.ASSIGN, line, column: initialColumn };
  };

  const handleLineId = () => {
    const initialColumn = column;
    let values = [];
    position += 1;
    column += 1;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    const idToken = { token: TOKENS.LINE_ID, line, column: initialColumn, value: values.join('') };

    const tokens = [idToken];

    while (input[position] === '&') {
      tokens.push(handleIdSuffix());
    }

    return tokens;
  };

  const handleIdSuffix = () => {
    const initialColumn = column;
    let values = [];
    position += 1;
    column += 1;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }

    return { token: TOKENS.ID_SUFFIX, line, column: initialColumn, value: values.join('') };
  };

  const handleTag = () => {
    const initialColumn = column;
    let values = [];
    position += 1;
    column += 1;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_|\-|\.]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    return { token: TOKENS.TAG, line, column: initialColumn, value: values.join('') };
  };

  const handleLink = () => {
    const initialColumn = column;
    position += 6;
    column += 6;

    let linkName = ''
    let linkPath = ''

    while (input[position] && input[position] != "\n") {
      if (input[position].match(/[A-Z|a-z|0-9|_]/)) {
        linkName += input[position];
        position += 1;
        column += 1;
      } else {
        break;
      }
    }

    let hasAssignment = false;

    while (input[position] && input[position] != "\n" && (input[position] == ' ' || input[position] == '=')) {
      position += 1;
      column += 1;

      if (input[position] == "=") {
        hasAssignment = true;
      }
    }

    if (hasAssignment) {
      while (input[position] && input[position] != "\n") {
        linkPath += input[position];
        position += 1;
        column += 1;
      }
    } else if (input[position] == "\n") {
      linkPath = linkName;
    }

    return { token: TOKENS.LINK_FILE, line, column: initialColumn, value: JSON.stringify({ name: linkName, path: linkPath })};
  };

  const handleBlock = () => {
    const initialColumn = column;
    let values = [];
    position += 2;
    column += 2;

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_| ]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }
    return { token: TOKENS.BLOCK, line, column: initialColumn, value: values.join('').trim() };
  };

  const handleDivert = (): TokenHandlerReturn => {
    const initialColumn = column;
    let values = [];
    position += 2;
    column += 2;

    while (input[position] && input[position] == " ") {
      position += 1;
      column += 1;
    }

    let token: Token;

    if (input[position] == "@") {
      position += 1;
      column += 1;
      token = handleDivertExt(initialColumn);
    } else {
      while (input[position] && input[position].match(/[A-Z|a-z|0-9|_| ]/)) {
        values.push(input[position]);
        position += 1;
        column += 1;
      }

      token = { token: TOKENS.DIVERT, line, column: initialColumn, value: values.join('').trim() };
    }

    const linebreak = getFollowingLineBreak();
    if (linebreak) {
      return [ token, linebreak ];
    }

    return token;
  };


  const handleDivertExt = (initialColumn: number): Token => {
    	let linkName = '';
    	let linkBlock = '';


      while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
        linkName += input[position];
        position += 1;
        column += 1;
      }

      if (input[position] && input[position] == ".") {
        position += 1;
        column += 1;
      }

      while (input[position] && input[position].match(/[A-Z|a-z|0-9|_| ]/)) {
        linkBlock += input[position];
        position += 1;
        column += 1;
      }

      const value = JSON.stringify({ link: linkName, block: linkBlock });

      return { token: TOKENS.DIVERT, line, column: initialColumn, value: value };
  };

  const handleDivertToParent = () => {
    const initialColumn = column;
    position += 2;
    column += 2;

    const token = { token: TOKENS.DIVERT_PARENT, line, column: initialColumn };
    const linebreak = getFollowingLineBreak();

    if (linebreak) {
      return [ token, linebreak ];
    }

    return token;
  };

  const handleStartVariations = (): Token[] => {
    const initialColumn = column;
    const values = [];
    column += 1;
    position += 1;
    stackMode(LexerMode.VARIATIONS);

    while (input[position] && input[position].match(/[A-Z|a-z| ]/)) {
      values.push(input[position]);
      position += 1;
      column += 1;
    }

    const tokens: Token[] = [
      { token: TOKENS.BRACKET_OPEN, line, column: initialColumn }
    ];

    const value = values.join('').trim();

    if (value.length) {
      tokens.push({ token: TOKENS.VARIATIONS_MODE, line, column: initialColumn + 2, value });
    }

    return tokens;
  };

  const handleStopVariations = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    popMode();
    return { token: TOKENS.BRACKET_CLOSE, line, column: initialColumn };
  };

  const handleVariationItem = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    return { token: TOKENS.MINUS, line, column: initialColumn };
  };

  const handleLogicOrMatchBlockStart = (): TokenHandlerReturn => {
    const blockStart = handleLogicBlockStart();

    while (input[position] && input[position].match(/[ \n\t]/)) {
      if (input[position] === '\n') {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
      position += 1;
    }

    if (checkSequence(input, position, 'match')) {
      const token = { token: TOKENS.KEYWORD_MATCH, line, column };
      position += 5;
      column += 5;

      handleSpace();

      const statement = handleLogicStatement();

      stackMode(LexerMode.MATCH);

      if (!statement) {
        return [].concat(blockStart, token);
      }

      return [].concat(blockStart, token, statement);
    }

    return blockStart;
  }

  const handleMatchBlock = (): TokenHandlerReturn | undefined => {
    if (input[position] === "}") {
      column += 1;
      position += 1;
      popMode();
      return { token: TOKENS.BRACE_CLOSE, line, column: column - 1 };
    }

    let statement: TokenHandlerReturn | undefined;

    if (checkSequence(input, position, 'else')) {
      statement = { token: TOKENS.KEYWORD_ELSE, line, column: column };
      position += 4;
      column += 4;
    } else if (checkSequence(input, position, 'then')) {
      statement = { token: TOKENS.KEYWORD_THEN, line, column: column };
      position += 4;
      column += 4;
    } else {
      statement = handleLogicStatement();
    }

    if (input[position] === ":") {
      column += 1;
      position += 1;
      stackMode(LexerMode.MATCH_BODY);
    }
    return statement;
  };

  const handleLogicBlockStart = (): TokenHandlerReturn => {
    const initialColumn = column;
    column += 1;
    position += 1;
    stackMode(LexerMode.LOGIC);
    const token = { token: TOKENS.BRACE_OPEN, line, column: initialColumn };
    const linebreak = getLeadingLineBreak();
    if (linebreak) {
      return [ linebreak, token ];
    }
    return token;
  };

  const handleLogicBlockStop = (): TokenHandlerReturn => {
    const initialColumn = column;
    column += 1;
    position += 1;
    popMode();
    const token = { token: TOKENS.BRACE_CLOSE, line, column: initialColumn };
    const linebreak = getFollowingLineBreak();
    if (linebreak) {
      return [ token, linebreak ];
    }
    return token;
  };

  const keywords = [
    'is', 'isnt', 'or', 'and', 'not', 'true', 'false', 'null',
    'set', 'trigger', 'when', 'match',
  ];

  const handleLogicIdentifier = (): TokenHandlerReturn => {
    const initialColumn = column;
    let values = '';

    if (input[position] == "@") {
      values += input[position];
      position += 1;
      column += 1;
    }

    while (input[position] && input[position].match(/[A-Z|a-z|0-9|_]/)) {
      values += input[position];
      position += 1;
      column += 1;
    }

    if (keywords.includes(values.toLowerCase())) {
      return handleLogicDescriptiveOperator(values, initialColumn);
    }

    return { token: TOKENS.IDENTIFIER, line, column: initialColumn, value: values.trim() };
  };

  const handleLogicDescriptiveOperator = (value: string, initialColumn: number): TokenHandlerReturn => {
    switch(value.toLowerCase()) {
      case 'not':
        return { token: TOKENS.NOT, line, column: initialColumn };
      case 'and':
        return { token: TOKENS.AND, line, column: initialColumn };
      case 'or':
        return { token: TOKENS.OR, line, column: initialColumn };
      case 'is':
        return { token: TOKENS.EQUAL, line, column: initialColumn };
      case 'isnt':
        return { token: TOKENS.NOT_EQUAL, line, column: initialColumn };
      case 'true':
      case 'false':
        return { token: TOKENS.BOOLEAN_LITERAL, line, column: initialColumn, value };
      case 'null':
        return { token: TOKENS.NULL_TOKEN, line, column: initialColumn };
      case 'set':
        return { token: TOKENS.KEYWORD_SET, line, column: initialColumn };
      case 'trigger':
        return { token: TOKENS.KEYWORD_TRIGGER, line, column: initialColumn };
      case 'when':
        return { token: TOKENS.KEYWORD_WHEN, line, column: initialColumn };
    }
  };

  const handleLogicNot = (): Token => {
    const initialColumn = column;
    column += 1;
    position += 1;
    return { token: TOKENS.NOT, line, column: initialColumn };
  };

  const handleLogicOperator = (token: string, length: number): Token => {
    const initialColumn = column;
    column += length;
    position += length;
    return { token, line, column: initialColumn };
  };

  const handleLogicNumber = () => {
    const initialColumn = column;
    let values = '';

    while (input[position] && input[position].match(/[0-9|.]/)) {
      values += input[position];
      position += 1;
      column += 1;
    }

    return { token: TOKENS.NUMBER_LITERAL, line, column: initialColumn, value: values };
  };

  const handleLogicString = () => {
    const initialColumn = column;
    column += 1;
    position += 1;
    const token = handleQText();
    column += 1;
    position += 1;

    token.token = TOKENS.STRING_LITERAL;
    token.column = initialColumn;

    return token;
  };

  const createSimpleToken = (token: string, length = 1): Token => {
    const initialColumn = column;
    column += length;
    position += length;
    return { token, line, column: initialColumn };
  };

  const handleLogicBlock = (): TokenHandlerReturn => {
    if (input[position] === '}') {
      return handleLogicBlockStop();
    }

    return handleLogicStatement();
  };

  const handleLogicStatement = (): TokenHandlerReturn => {
    if (input[position] === '"' || input[position] == "'") {
      if (currentQuote === null) {
        currentQuote = input[position]
      }
      return handleLogicString();
    }

    if (input[position] === '(') {
      return createSimpleToken(TOKENS.BRACKET_OPEN, 1);
    }

    if (input[position] === ')') {
      return createSimpleToken(TOKENS.BRACKET_CLOSE, 1);
    }

    if (checkSequence(input, position, '==')) {
      return handleLogicOperator(TOKENS.EQUAL, 2);
    }

    if (checkSequence(input, position, '!=')) {
      return handleLogicOperator(TOKENS.NOT_EQUAL, 2);
    }

    if (checkSequence(input, position, '&&')) {
      return handleLogicOperator(TOKENS.AND, 2);
    }

    if (checkSequence(input, position, '||')) {
      return handleLogicOperator(TOKENS.OR, 2);
    }

    if (checkSequence(input, position, '<=')) {
      return handleLogicOperator(TOKENS.LE, 2);
    }

    if (checkSequence(input, position, '>=')) {
      return handleLogicOperator(TOKENS.GE, 2);
    }

    if (checkSequence(input, position, '<')) {
      return handleLogicOperator(TOKENS.LESS, 1);
    }

    if (checkSequence(input, position, '>')) {
      return handleLogicOperator(TOKENS.GREATER, 1);
    }

    if (input[position] === '=') {
      return createSimpleToken(TOKENS.ASSIGN);
    }

    if (checkSequence(input, position, '?=')) {
      return createSimpleToken(TOKENS.ASSIGN_INIT, 2);
    }

    if (checkSequence(input, position, '-=')) {
      return createSimpleToken(TOKENS.ASSIGN_SUB, 2);
    }

    if (checkSequence(input, position, '+=')) {
      return createSimpleToken(TOKENS.ASSIGN_SUM, 2);
    }

    if (checkSequence(input, position, '*=')) {
      return createSimpleToken(TOKENS.ASSIGN_MULT, 2);
    }

    if (checkSequence(input, position, '/=')) {
      return createSimpleToken(TOKENS.ASSIGN_DIV, 2);
    }

    if (checkSequence(input, position, '^=')) {
      return createSimpleToken(TOKENS.ASSIGN_POW, 2);
    }

    if (checkSequence(input, position, '%=')) {
      return createSimpleToken(TOKENS.ASSIGN_MOD, 2);
    }

    if (input[position] === '+') {
      return createSimpleToken(TOKENS.PLUS, 1);
    }

    if (input[position] === '-') {
      return createSimpleToken(TOKENS.MINUS, 1);
    }

    if (input[position] === '*') {
      return createSimpleToken(TOKENS.MULT, 1);
    }

    if (input[position] === '/') {
      return createSimpleToken(TOKENS.DIV, 1);
    }

    if (input[position] === '^') {
      return createSimpleToken(TOKENS.POWER, 1);
    }

    if (input[position] === '%') {
      return createSimpleToken(TOKENS.MOD, 1);
    }

    if (input[position] === ',') {
      return createSimpleToken(TOKENS.COMMA, 1);
    }

    if (input[position] === '!') {
      return handleLogicNot();
    }

    if (input[position].match(/[0-9]/)) {
      return handleLogicNumber();
    }

    if (input[position].match(/[A-Za-z@_]/)) {
      return handleLogicIdentifier();
    }
  };

  const getFollowingLineBreak = (): Token | void => {
    let lookupPosition = position;
    let lookupColumn = column;
    while (input[lookupPosition]?.match(/[\t ]/)) {
      lookupPosition += 1;
      lookupColumn += 1;
    }

    if (input[lookupPosition] === '\n') {
      return { token: TOKENS.LINE_BREAK, line, column: lookupColumn };
    }
  };

  const getLeadingLineBreak = () => {
    let lookupPosition = position - 2;
    while (input[lookupPosition]?.match(/[\t ]/)) {
      lookupPosition -= 1;
    }

    if (input[lookupPosition] === '\n') {
      return { token: TOKENS.LINE_BREAK, line, column: 0 };
    }
  };

  // get next token
  function getNextToken(): TokenHandlerReturn {
    if (!isCurrentMode(LexerMode.QSTRING) && input[position] === '-' && input[position + 1] === '-') {
      return handleComments();
    }

    if (!isCurrentMode(LexerMode.QSTRING) && input[position] === '\n') {
      return handleLineBreaks();
    }

    if (!isCurrentMode(LexerMode.LOGIC) && ((column === 0 && input[position].match(/[\t ]/)) || (column === 0 && indent.length > 1))) {
      return handleIndent();
    }

    if (!isCurrentMode(LexerMode.QSTRING) && input[position] === '{') {
      return handleLogicOrMatchBlockStart();
    }

    if(isCurrentMode(LexerMode.LOGIC)) {
      const response = handleLogicBlock();

      if (response)  {
        return response;
      }
    }

    if(isCurrentMode(LexerMode.MATCH)) {
      const response = handleMatchBlock();

      if (response)  {
        return response;
      }
    }

    if (input[position] === '"' || input[position] === "'") {
      if (currentQuote === null) {
        currentQuote = input[position]
      }

      if (input[position] === currentQuote) {
        return handleQuote();
      }
    }

    if (isCurrentMode(LexerMode.QSTRING)) {
      return handleQText();
    }

    if (input[position] === ' ') {
      return handleSpace();
    }

    if (input[position].match(/\t/)) {
      return handleRogueTab();
    }

    if (input[position] === '(') {
      return handleStartVariations();
    }

    if (input[position] === ')') {
      return handleStopVariations();
    }

    if (column === 0 && input[position] === '=' && input[position + 1] === '=') {
      return handleBlock();
    }

    if (column === 0 && checkSequence(input, position, "@link")) {
      return handleLink();
    }

    if (input[position] === '-' && input[position + 1] === '>') {
      return handleDivert();
    }

    if (input[position] === '<' && input[position + 1] === '-') {
      return handleDivertToParent();
    }

    if (isCurrentMode(LexerMode.VARIATIONS) && input[position] === '-') {
      return handleVariationItem();
    }

    if (input[position] === '*' || input[position] === '+'|| input[position] === '>') {
      return handleOption();
    }

    if (isCurrentMode(LexerMode.OPTION) && input[position] === '=') {
      return handleOptionDisplayChar();
    }

    if (input[position] === '$') {
      return handleLineId();
    }

    if (input[position] === '#') {
      return handleTag();
    }

    return handleText();
  }

  return {
    // returns a list with all tokens
    getAll() {
      let tokens: Token[] = [];
      while (position < length) {
        const token = getNextToken();
        if (token) {
          if (Array.isArray(token)) {
            tokens = tokens.concat(token);
          } else {
            tokens.push(token);
          }
        }
      }

      position += 1;
      tokens.push({ token: TOKENS.EOF, line, column });

      return tokens;
    },

    // retuns a token each time
    next(): Token {
      if (pendingTokens.length) {
        return pendingTokens.shift()!;
      }

      while (position < length) {
        const token = getNextToken();
        if (token) {
          if (Array.isArray(token)) {
            pendingTokens = token;
            return pendingTokens.shift()!;
          } else {
            return token;
          }
        }
      }

      return { token: TOKENS.EOF, line, column };
    }
  }
}

