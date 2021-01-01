%%

expressions
  : document EOF { return $1; }
  | NEWLINE document EOF { return $2; }
  ;

document
  : { $$ = Document([]) }/* empty */
  | blocks { $$ = $1 }
  ;

blocks
  : blocks block
    { $1.blocks = $1.blocks.concat([$2]); $$ = $1; }
  | block { $$ = Document([], [$1]); }
  | lines { $$ = Document([$1]); }
  ;

block
  : BLOCK_START NEWLINE lines { $$ = Block($1, $3) }
  ;

lines
  : lines line
    { $1.content = $1.content.concat([$2]); $$ = $1 }
  | line
    { $$ = Content([$1]) }
  ;

line
  : dialogue_line NEWLINE { $$ = $1 }
  | DIVERT NEWLINE { $$ = Divert($1); }
  | DIVERT_PARENT NEWLINE { $$ = Divert('<parent>'); }
  | option_block
  | alternatives
  | condition_statement line { $$ = ConditionalContent($1, $2) }
  | condition_statement NEWLINE { $$ = ConditionalContent($1) }
  | assignment_statement NEWLINE
  | dialogue_line assignment_statement NEWLINE { $$ = ActionContent($2, $1) }
  | dialogue_block
  ;

dialogue_line
  : SPEAKER LINE { $$ = Line($2, $1); }
  | SPEAKER LINE LINE_ID { $$ = Line($2, $1, $3); }
  | LINE LINE_ID { $$ = Line($1, undefined, $2); }
  | LINE { $$ = Line(yytext); }
  ;

dialogue_block
  : dialogue_line NEWLINE INDENT just_lines NEWLINE DEDENT
    { $$ = Line($1.value + ' ' + $4.value, $1.speaker, $1.id); }
  | dialogue_line NEWLINE INDENT just_lines LINE_ID NEWLINE DEDENT
    { $$ = Line($1.value + ' ' + $4.value, $1.speaker, $5); }
  ;

just_lines
  : just_lines NEWLINE LINE { $$ = Line($1.value + ' ' + $3); }
  | LINE { $$ = Line(yytext); }
  ;

option_block
  : OPTION_LIST_START NEWLINE INDENT options DEDENT OPTION_LIST_END NEWLINE
    { $$ = OptionList(undefined, $4) }
  | OPTION_LIST_START LINE NEWLINE INDENT options DEDENT OPTION_LIST_END NEWLINE
    { $$ = OptionList($2, $5) }
  | OPTION_LIST_START LINE LINE_ID NEWLINE INDENT options DEDENT OPTION_LIST_END NEWLINE
    { $$ = OptionList($2, $6, $3) }
  | OPTION_LIST_START SPEAKER LINE NEWLINE INDENT options DEDENT OPTION_LIST_END NEWLINE
    { $$ = OptionList($3, $6, undefined, $2) }
  | OPTION_LIST_START SPEAKER LINE LINE_ID NEWLINE INDENT options DEDENT OPTION_LIST_END NEWLINE
    { $$ = OptionList($3, $7, $4, $2) }
  ;

options
  : options option
    { $$ = $1.concat([$2]); }
  | option
    { $$ = [$1] }
  ;

option
  : option_mode LINE NEWLINE INDENT lines DEDENT
    { $$ = Option($2, $1, $5) }
  | option_mode LINE LINE_ID NEWLINE INDENT lines DEDENT
    { $$ = Option($2, $1, $6, $3) }
  | condition_statement option { $$ = ConditionalContent($1, $2) }
  ;

option_mode
  : OPTION { $$ = $1 }
  | STICKY_OPTION { $$ = $1 }
  ;

alternatives
  : ALTERNATIVES_START NEWLINE INDENT lines DEDENT ALTERNATIVES_END NEWLINE
    { $$ = AlternativeList($1, $4) }
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

function Line(value, speaker, id) {
  return { type: 'line', value, speaker, id };
}

function Block(blockName, content = []) {
  return { type: 'block', name: blockName, content };
}

function OptionList(name, content = [], id, speaker) {
  return { type: 'options', name, content, id, speaker };
}

function Option(name, mode, content = [], id) {
  return { type: 'option', name, mode, content, id };
}

function AlternativeList(mode, content = []) {
  return { type: 'alternatives', mode, content };
}

function Divert(target) {
  return { type: 'divert', target };
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

function Content(content) {
  return { type: 'content', content };
}

function Document(content = [], blocks = []) {
  return { type: 'document', content, blocks };
}

