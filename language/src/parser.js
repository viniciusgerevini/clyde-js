import { TOKENS, tokenize, getTokenFriendlyHint } from './lexer';


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
    ];
    let lines;
    consume(acceptableNext);
    switch (currentToken.token) {
      case TOKENS.SPEAKER:
      case TOKENS.TEXT:
      case TOKENS.QUOTE:
        lines = [Line()];
        break;
      case TOKENS.OPTION:
      case TOKENS.STICKY_OPTION:
        lines = [Options()];
        break;
      case TOKENS.DIVERT:
      case TOKENS.DIVERT_PARENT:
        lines = [Divert()];
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
      // default:
      //   wrongTokenError(currentToken, [TOKENS.SPEAKER, TOKENS.TEXT])
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

  const Options = () => {
    const options = OptionsNode(
      [Option()]
    );
    while (peek([TOKENS.OPTION, TOKENS.STICKY_OPTION])) {
      consume([TOKENS.OPTION, TOKENS.STICKY_OPTION]);
      options.content.push(Option());
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

  const result = Document();
  if (peek()) {
    consume([ TOKENS.EOF ]);
  }
  return result;
}


const DocumentNode = (content = [], blocks = []) => {
  return { type: 'document', content, blocks};
};

const ContentNode = (content) => {
  return { type: 'content', content };
};

const BlockNode = (blockName, content = []) => {
  return { type: 'block', name: blockName, content };
}

const LineNode = (value, speaker, id, tags) => {
  return { type: 'line', value, speaker, id, tags };
};

const OptionsNode = (content = [], name, id, speaker, tags) => {
  return { type: 'options', name, content, id, speaker, tags };
}

const OptionNode = (content = [], mode, name, id, speaker, tags) => {
  return { type: 'option', name, mode, content, id, speaker, tags };
}

const DivertNode = (target) => {
  if (target === 'END') {
    target = '<end>';
  }
  return { type: 'divert', target };
}
