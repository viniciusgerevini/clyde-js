%%

expressions
  : document EOF { return $1; }
  ;

document
  : /* empty */
  | blocks
  ;

blocks
  : blocks block
    { $$ = $1.concat([$2]) }
  | block
    { $$ = [$1] }
  | lines
  ;

block
  : BLOCK_START NEWLINE lines { $$ = DialogBlock($1, $3) }
  ;

lines
  : lines line
    { $$ = $1.concat([$2]) }
  | line
    { $$ = [$1] }
  ;

line
  : SPEAKER LINE NEWLINE { $$ = DialogLine($2, $1); }
  | SPEAKER LINE LINE_ID NEWLINE { $$ = DialogLine($2, $1, $3); }
  | LINE LINE_ID NEWLINE { $$ = DialogLine($1, undefined, $2); }
  | LINE NEWLINE { $$ = DialogLine(yytext); }
  | DIVERT { $$ = Divert($1); }
  | DIVERT_PARENT { $$ = Divert('<parent>'); }
  | topic_block
  | alternatives
  | anchor
  | condition_statement line { $$ = ConditionalContent($1, $2) }
  /* | operations */
  /* | line operation */
  | NEWLINE
  ;

topic_block
  : TOPIC_LIST_START INDENT topics DEDENT TOPIC_LIST_END
    { $$ = DialogTopicList($1, $3) }
  ;

topics
  : topics topic
    { $$ = $1.concat([$2]); }
  | topic
    { $$ = [$1] }
  | anchor
    { $$ = [$1] }
  ;

topic
  : TOPIC NEWLINE INDENT lines DEDENT
    { $$ = DialogTopic($1, 'once', $4) }
  | STICKY_TOPIC NEWLINE INDENT lines DEDENT
    { $$ = DialogTopic($1, 'sticky', $4) }
  ;

alternatives
  : ALTERNATIVES_START INDENT lines DEDENT ALTERNATIVES_END
    { $$ = DialogAlternativeList($1, $3) }
  ;

anchor
  : ANCHOR NEWLINE { $$ = Anchor($1); }
  ;

condition_statement
  : '{' logic_expression '}' { $$ = $2 }
  ;

/* # TODO parentesis ( ) */
/* # TODO value */
/* # TODO == != */
/* # TODO > >= <= < */
/* # TODO ! not */
logic_expression
  : logic_expression infixed_operators variable { $$ = Expression($2, [$3, $1]) }
  | variable
  ;

infixed_operators
  : infixed_logical_operators
  ;

infixed_logical_operators
  : AND { $$ = $1 }
  | OR { $$ = $1 }
  ;

variable
  : VARIABLE { $$ = Variable($1) }
  ;

/* value */
/*   : VALUE { $$ = Variable($1) } */
/*   ; */

%%

function DialogLine(value, speaker, id) {
  return { type: 'line', value, speaker, id };
}

function DialogBlock(blockName, content = []) {
  return { type: 'block', name: blockName, content };
}

function DialogTopicList(name, content = []) {
  return { type: 'topics', name, content };
}

function DialogTopic(name, mode, content = []) {
  return { type: 'topic', name, mode, content };
}

function DialogAlternativeList(mode, content = []) {
  return { type: 'alternatives', mode, content };
}

function Divert(target) {
  return { type: 'divert', target };
}

function Anchor(name) {
  return { type: 'anchor', name };
}

function Expression(name, elements) {
  return { type: 'expression', name, elements };
}

function ConditionalContent(conditions, content) {
  return { type: 'conditional_content', conditions, content };
}

function Variable(name) {
  return { type: 'variable', name };
}

function Value(value) {
  return { type: 'value', value };
}
