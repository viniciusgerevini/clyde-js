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
  /* : BLOCK_START NEWLINE INDENT lines DEDENT { $$ = DialogBlock($1, $2) } */
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
  | DIVERT { $$ = Divert($1)}
  | topic_block
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
  ;

topic
  : TOPIC NEWLINE INDENT lines DEDENT
    { $$ = DialogTopic($1, 'once', $4) }
  | STICKY_TOPIC NEWLINE INDENT lines DEDENT
    { $$ = DialogTopic($1, 'sticky', $4) }
  ;

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

function Divert(target) {
  return { type: 'divert', target };
}

/* "NEWLINE INDENT lines DEDENT" */

