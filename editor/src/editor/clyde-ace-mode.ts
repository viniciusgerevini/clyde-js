// @ts-nocheck
export default function setupClydeMode(ace) {

  ace.define('ace/mode/clyde_highlight_rules', ['require', 'exports', 'ace/lib/oop', 'ace/mode/text_highlight_rules'], (acequire, exports) => {
    const oop = acequire('ace/lib/oop');
    const TextHighlightRules = acequire('ace/mode/text_highlight_rules').TextHighlightRules;


    oop.inherits(ClydeHighlightRules, TextHighlightRules);

    exports.ClydeHighlightRules = ClydeHighlightRules;
  });

  ace.define('ace/mode/clyde', ['require', 'exports', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/clyde_highlight_rules'], (acequire, exports) => {
    const oop = acequire('ace/lib/oop');
    const TextMode = acequire('ace/mode/text').Mode;
    const HighlightRules = acequire('ace/mode/clyde_highlight_rules').ClydeHighlightRules;

    const ClydeMode = function ClydeMode() {
      this.$id = "ace/mode/clyde"
      this.HighlightRules = HighlightRules;
      this.lineCommentStart = '--';

      this.getNextLineIndent = function(state, line, tab) {
        let indent = this.$getIndent(line);

        const { tokens } = this.getTokenizer().getLineTokens(line, state);

        if (tokens.length && tokens[tokens.length-1].type === 'comment') {
          return indent;
        }

        if (state === "start") {
          const match = line.match(/^\s*(\(|\*|\+)/);
          if (match) {
            indent += tab;
          }
        }

        return indent;
      };
    };

    oop.inherits(ClydeMode, TextMode); // ACE's way of doing inheritance

    exports.Mode = ClydeMode;
  });
};



function ClydeHighlightRules() {
  // regexp must not have capturing parentheses. Use (?:) instead.
  // regexps are ordered -> the first match is used
  const literals = [
    { // boolean
      token : 'constant.language.boolean',
      regex : /(true|false)/,
    },
    { // numbers
      token : 'constant.numeric',
      regex : /[0-9,.]+/,
    },
    { // string
      token : 'constant.string',
      regex : /(".*")/,
    },
  ];

  const logicalOperators = [
    { // operators
      token : 'keyword.operator',
      regex : /(isnt|ISNT)/,
    },
    { // operators
      token : 'keyword.operator',
      regex : /(and|or|not|is|AND|OR|NOT|IS)/,
    },
    { // operators
      token : 'keyword.operator',
      regex : /(&&|\|\||<=|>=|==|!=)/,
    },
    { // operators
      token : 'keyword.operator',
      regex : /(\*|\+|-|\^|\/|%|<|>|!)/,
    },
  ]

  const assignmentOperators = [
    { // operators
      token : 'keyword.operator',
      regex : /(\+=|-=|\*=|\/=|%=|\^=)/,
    },
    { // operators
      token : 'keyword.operator',
      regex : /(=)/,
    },
  ];

  const logicBlockEnd = [
    { // assignment block end
      token : 'keyword',
      regex : /(\})/,
      next: 'start'
    },
  ];

  const logicBlockConstants = [
    {
      token : 'support.constant',
      regex : /OPTIONS_COUNT/
    },
  ];

  const identifiers = [
    {
      token : 'identifier',
      regex : /[a-zA-Z_][a-zA-Z0-9_]+/
    },
  ];


  this.$rules = {
    "start" : [
      {
        token : 'comment',
        regex : /^\s*--.*$/
      },

      { // Block definition
        token : ["keyword", "text", "variable"],
        regex : /^(==)(\s*)([a-zA-Z0-9_ ]+)$/
      },

      { // Divert to end
        token : ["text", "keyword", "text", "support.constant"],
        regex : /(\s*)(->)(\s*)(END)$/
      },

      { // Divert
        token : ["text", "keyword", "text", "variable"],
        regex : /(\s*)(->)(\s*)([a-zA-Z0-9_ ]+)/
      },

      { // Divert to parent
        token : ["text", "keyword", "text"],
        regex : /(\s*)(<-)(\s*)/
      },

      { // Variations start
        token : ["text", "keyword", "text", "support.constant"],
        regex : /^(\s*)(\()(\s*)((?:shuffle|once|sequence|shuffle once|shuffle sequence)*)$/
      },

      { // Variations end
        token : ["text", "keyword"],
        regex : /^(\s*)(\))$/
      },

      { // option
        token : "keyword.control",
        regex : /^(\s*[*+>])/
      },

      { // Logic block start
        token : "keyword",
        regex : /(\{)/,
        next: 'logicBlock'
      },

      { // tag block
        token : 'constant.string',
        regex : /#[a-zA-Z0-9_]+/
      },

      { // Line
        token : ['variable', 'text', 'variable'],
        regex: /((?:\s*[a-zA-Z0-9_] +:)?\s*)(".*")((?:\$[a-zA-Z0-9_]+)?)/,
      },
      { // Line
        token : ['variable', 'text', 'variable'],
        regex: /((?:\s*[a-zA-Z0-9_ ]+:)?\s*)([^\r\n#${]+)((?:\$[a-zA-Z0-9_]+)?)/,
      }
    ],
    logicBlock: [
      { // assignment block start
        token : 'keyword.control',
        regex : /(set)/,
        next: 'assignmentBlock'
      },
      { // event block start
        token : 'keyword.control',
        regex : /(trigger)/,
        next: 'eventBlock'
      },
      { // event block start
        token : 'keyword.control',
        regex : /(when)/,
      },
      ...logicBlockConstants,
      ...logicalOperators,
      ...literals,
      ...identifiers,
      ...logicBlockEnd
    ],
    assignmentBlock: [
      ...logicBlockConstants,
      ...logicalOperators,
      ...assignmentOperators,
      ...literals,
      ...identifiers,
      ...logicBlockEnd
    ],
    eventBlock: [
      ...identifiers,
      ...logicBlockEnd
    ],
  };

  this.normalizeRules();
}
