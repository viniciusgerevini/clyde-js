export function getTokenFriendlyHint(token: any): any;
export function tokenize(input: any): {
    getAll(): any[];
    next(): any;
};
export function Token(token: any, line: any, column: any, value: any): {
    token: any;
    value: any;
    line: any;
    column: any;
};
export namespace TOKENS {
    const TEXT: string;
    const INDENT: string;
    const DEDENT: string;
    const OPTION: string;
    const STICKY_OPTION: string;
    const FALLBACK_OPTION: string;
    const SQR_BRACKET_OPEN: string;
    const SQR_BRACKET_CLOSE: string;
    const BRACKET_OPEN: string;
    const BRACKET_CLOSE: string;
    const EOF: string;
    const SPEAKER: string;
    const LINE_ID: string;
    const TAG: string;
    const BLOCK: string;
    const DIVERT: string;
    const DIVERT_PARENT: string;
    const VARIATIONS_MODE: string;
    const MINUS: string;
    const PLUS: string;
    const MULT: string;
    const DIV: string;
    const POWER: string;
    const MOD: string;
    const BRACE_OPEN: string;
    const BRACE_CLOSE: string;
    const AND: string;
    const OR: string;
    const NOT: string;
    const EQUAL: string;
    const NOT_EQUAL: string;
    const GE: string;
    const LE: string;
    const GREATER: string;
    const LESS: string;
    const NUMBER_LITERAL: string;
    const NULL_TOKEN: string;
    const BOOLEAN_LITERAL: string;
    const STRING_LITERAL: string;
    const IDENTIFIER: string;
    const KEYWORD_SET: string;
    const KEYWORD_TRIGGER: string;
    const KEYWORD_WHEN: string;
    const ASSIGN: string;
    const ASSIGN_SUM: string;
    const ASSIGN_SUB: string;
    const ASSIGN_DIV: string;
    const ASSIGN_MULT: string;
    const ASSIGN_POW: string;
    const ASSIGN_MOD: string;
    const COMMA: string;
    const LINE_BREAK: string;
}
