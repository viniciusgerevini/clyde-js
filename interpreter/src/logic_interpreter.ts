import {
  VariableNode,
  NumberLiteralNode,
  BooleanLiteralNode,
  StringLiteralNode,
  ExpressionNode,
  AssignmentNode,
  OperandNode,
} from '@clyde-lang/parser';

import { MemoryManager } from './memory';

export interface LogicInterpreterInstance {
  checkCondition(condition: OperandNode): any;
  handleAssignement(assignment: AssignmentNode): any;
}

type Handler = { [op: string]: Function };

export const LogicInterpreter = (mem: MemoryManager): LogicInterpreterInstance => {
  const expressionHandlers: Handler = {
    'equal': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) === getNodeValue(cond.elements[1]),
    'not_equal': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) !== getNodeValue(cond.elements[1]),
    'greater_than': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) > getNodeValue(cond.elements[1]),
    'greater_or_equal': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) >= getNodeValue(cond.elements[1]),
    'less_than': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) < getNodeValue(cond.elements[1]),
    'less_or_equal': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) <= getNodeValue(cond.elements[1]),
    'and': (cond: ExpressionNode) => checkCondition(cond.elements[0]) && checkCondition(cond.elements[1]),
    'or': (cond: ExpressionNode) => checkCondition(cond.elements[0]) || checkCondition(cond.elements[1]),
    'not': (cond: ExpressionNode) => !checkCondition(cond.elements[0]),
    'mult': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) * getNodeValue(cond.elements[1]),
    'div': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) / getNodeValue(cond.elements[1]),
    'sub': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) - getNodeValue(cond.elements[1]),
    'add': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) + getNodeValue(cond.elements[1]),
    'pow': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) ** getNodeValue(cond.elements[1]),
    'mod': (cond: ExpressionNode) => getNodeValue(cond.elements[0]) % getNodeValue(cond.elements[1]),
    'error': (cond: ExpressionNode) => { throw new Error(`Unknown expression "${cond.name}"`) }
  };

  const conditionHandlers: Handler = {
    'expression': (condition: ExpressionNode) => checkExpression(condition),
    'variable': (condition: VariableNode) => checkVariable(condition),
    'error': (condition: any) => { throw new Error(`Unknown condition type "${condition.type}"`) }
  };

  const operationHandlers: Handler = {
    'assign': (name: string, value: any) => mem.setVariable(name, value),
    'assign_sum': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) + value),
    'assign_sub': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) - value),
    'assign_mult': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) * value),
    'assign_div': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) / value),
    'assign_pow': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) ** value),
    'assign_mod': (name: string, value: number) => mem.setVariable(name, mem.getVariable<number>(name) % value),
    'error': (_n: any, _v: any, a: AssignmentNode) => { throw new Error(`Unknown operation "${a.operation}"`) }
  };

  const nodeValueHandlers: Handler = {
    'literal': (node: NumberLiteralNode | StringLiteralNode | BooleanLiteralNode) => node.value,
    'variable': (node: VariableNode) => mem.getVariable(node.name),
    'assignment': (node: AssignmentNode) => handleAssignement(node),
    'expression': (node: ExpressionNode) => checkExpression(node),
    'error': (node: any) => { throw new Error(`Unknown node "${node.type}"`) }
  };

  const handleAssignement = (assignment: AssignmentNode): any => {
    const variable = assignment.variable;
    const source = assignment.value;
    const value = getNodeValue(source);

    return (operationHandlers[assignment.operation] || operationHandlers['error'])(variable.name, value, assignment);
  };

  const getNodeValue = (source: any): any =>
    (nodeValueHandlers[source.type] || nodeValueHandlers['error'])(source);

  const checkCondition = (condition: any): any =>
    (conditionHandlers[condition.type] || conditionHandlers['error'])(condition);

  const checkExpression = (condition: ExpressionNode): boolean =>
    (expressionHandlers[condition.name] || expressionHandlers['error'])(condition);

  const checkVariable = (variable: VariableNode) => mem.getVariable(variable.name);

  return {
    checkCondition,
    handleAssignement,
  };
};

