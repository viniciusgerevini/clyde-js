%%

expressions
  : document EOF { return $1; }
  | NEWLINE document EOF { return $2; }
  ;

document
  : { $$ = Document([]) }/* empty */
  | blocks { $$ = Document($1) }
  ;

blocks
  : blocks block
    { $$ = $1.concat([$2]) }
  | block
    { $$ = [$1] }
  | lines { $$ = [$1] }
  ;

block
  : BLOCK_START NEWLINE lines { $$ = DialogBlock($1, $3) }
  ;

lines
  : lines line
    { $1.lines = $1.lines.concat([$2]); $$ = $1 }
  | line
    { $$ = Content([$1]) }
  ;

line
  : dialog_line NEWLINE { $$ = $1 }
  | DIVERT { $$ = Divert($1); }
  | DIVERT_PARENT { $$ = Divert('<parent>'); }
  | topic_block
  | alternatives
  | anchor
  | condition_statement line { $$ = ConditionalContent($1, $2) }
  | condition_statement NEWLINE { $$ = ConditionalContent($1) }
  | assignment_statement NEWLINE
  | dialog_line assignment_statement NEWLINE { $$ = ActionContent($2, $1) }
  ;

dialog_line
  : SPEAKER LINE { $$ = DialogLine($2, $1); }
  | SPEAKER LINE LINE_ID { $$ = DialogLine($2, $1, $3); }
  | LINE LINE_ID { $$ = DialogLine($1, undefined, $2); }
  | LINE { $$ = DialogLine(yytext); }
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
  | condition_statement topic { $$ = ConditionalContent($1, $2) }
  ;

alternatives
  : ALTERNATIVES_START INDENT lines DEDENT ALTERNATIVES_END
    { $$ = DialogAlternativeList($1, $3) }
  ;

anchor
  : ANCHOR NEWLINE { $$ = Anchor($1); }
  ;

condition_statement
  : '{' logical_or_expression '}' { $$ = $2 }
  ;

assignment_statement
  : '{' 'set' assignments '}' { $$ = $3 }
  ;

assignments
  : assignments ',' assignment_expression
    { $$ = Assignments($1.assignments.concat([$3])) }
  | assignment_expression
    { $$ = Assignments([$1]) }
  ;

assignment_expression
  : variable assignment_operator logical_or_expression { $$ = Assignment($1, $2, $3)}
  | variable assignment_operator assignment_expression { $$ = Assignment($1, $2, $3)}
  ;

logical_or_expression
  : logical_and_expression
  | logical_or_expression OR logical_and_expression { $$ = Expression($2, [$1, $3]) }
  |
  ;

logical_and_expression
    : equality_expression
    | logical_and_expression AND equality_expression { $$ = Expression($2, [$1, $3]) }
    ;

equality_expression
  : relational_expression
  | equality_expression EQUAL relational_expression { $$ = Expression($2, [$1, $3]) }
  | equality_expression NOT_EQUAL relational_expression { $$ = Expression($2, [$1, $3]) }
  ;

relational_expression
  : not_expression
  | relational_expression "<" not_expression { $$ = Expression($2, [$1, $3]) }
  | relational_expression ">" not_expression { $$ = Expression($2, [$1, $3]) }
  | relational_expression "GE" not_expression { $$ = Expression($2, [$1, $3]) }
  | relational_expression "LE" not_expression { $$ = Expression($2, [$1, $3]) }
  ;

not_expression
  :additive_expression
  | NOT operand { $$ = Expression($1, [$2]) }
  ;

additive_expression
  : multiplicative_expression
  | additive_expression "+" multiplicative_expression { $$ = Expression($2, [$1, $3]) }
  | additive_expression "-" multiplicative_expression { $$ = Expression($2, [$1, $3]) }
  ;

multiplicative_expression
  : power_expression
  | multiplicative_expression '*' power_expression { $$ = Expression($2, [$1, $3]) }
  | multiplicative_expression '/' power_expression { $$ = Expression($2, [$1, $3]) }
  | multiplicative_expression '%' power_expression { $$ = Expression($2, [$1, $3]) }
  ;

power_expression
  : operand
  | power_expression '^' operand { $$ = Expression($2, [$1, $3]) }
  ;

operand
  : variable
  | literal
  ;

literal
  : NULL_TOKEN { $$ = NullToken() }
  | NUMBER_LITERAL { $$ = Literal('number', $1) }
  | BOOLEAN_LITERAL { $$ = Literal('boolean', $1) }
  | STRING_LITERAL { $$ = Literal('string', $1) }
  ;

variable
  : VARIABLE { $$ = Variable($1) }
  ;

assignment_operator
  : '=' { $$ = $1 }
  | PLUSEQUAL { $$ = $1 }
  | MINUSEQUAL { $$ = $1 }
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

function Assignments(assignments) {
  return { type: 'assignments', assignments };
}

function Assignment(variable, operation, value) {
  return { type: 'assignment', variable, operation, value };
}

function ConditionalContent(conditions, content) {
  return { type: 'conditional_content', conditions, content };
}

function ActionContent(action, content) {
  return { type: 'action_content', action, content };
}

function Variable(name) {
  return { type: 'variable', name };
}

function Literal(name, value) {
  return { type: 'literal', name, value };
}

function NullToken() {
  return { type: 'null' };
}

function Content(lines) {
  return { type: 'content', lines };
}

function Document(content) {
  return { type: 'document', content };
}
