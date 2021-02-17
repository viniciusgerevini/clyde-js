export function DocumentNode(content?: any[], blocks?: any[]): {
    type: string;
    content: any[];
    blocks: any[];
};
export function ContentNode(content: any): {
    type: string;
    content: any;
};
export function BlockNode(blockName: any, content: any): {
    type: string;
    name: any;
    content: any;
};
export function LineNode(value: any, speaker: any, id: any, tags: any): {
    type: string;
    value: any;
    speaker: any;
    id: any;
    tags: any;
};
export function OptionsNode(content: any, name: any, id: any, speaker: any, tags: any): {
    type: string;
    name: any;
    content: any;
    id: any;
    speaker: any;
    tags: any;
};
export function OptionNode(content: any, mode: any, name: any, id: any, speaker: any, tags: any): {
    type: string;
    name: any;
    mode: any;
    content: any;
    id: any;
    speaker: any;
    tags: any;
};
export function DivertNode(target: any): {
    type: string;
    target: any;
};
export function VariationsNode(mode: any, content?: any[]): {
    type: string;
    mode: any;
    content: any[];
};
export function VariableNode(name: any): {
    type: string;
    name: any;
};
export function NumberLiteralNode(value: any): {
    type: string;
    name: any;
    value: any;
};
export function BooleanLiteralNode(value: any): {
    type: string;
    name: any;
    value: any;
};
export function StringLiteralNode(value: any): {
    type: string;
    name: any;
    value: any;
};
export function LiteralNode(name: any, value: any): {
    type: string;
    name: any;
    value: any;
};
export function NullTokenNode(): {
    type: string;
};
export function ConditionalContentNode(conditions: any, content: any): {
    type: string;
    conditions: any;
    content: any;
};
export function ActionContentNode(action: any, content: any): {
    type: string;
    action: any;
    content: any;
};
export function ExpressionNode(name: any, elements: any): {
    type: string;
    name: any;
    elements: any;
};
export function AssignmentsNode(assignments: any): {
    type: string;
    assignments: any;
};
export function AssignmentNode(variable: any, operation: any, value: any): {
    type: string;
    variable: any;
    operation: any;
    value: any;
};
export function EventsNode(events: any): {
    type: string;
    events: any;
};
export function EventNode(name: any): {
    type: string;
    name: any;
};
