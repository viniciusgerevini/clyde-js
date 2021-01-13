export const LogicInterpreter = (mem) => {
  const SPECIAL_VARIABLE_NAMES = [ 'OPTIONS_COUNT' ];

  const expressionHandlers = {
    'equal': cond => getNodeValue(cond.elements[0]) === getNodeValue(cond.elements[1]),
    'not_equal': cond => getNodeValue(cond.elements[0]) !== getNodeValue(cond.elements[1]),
    'greater_than': cond => getNodeValue(cond.elements[0]) > getNodeValue(cond.elements[1]),
    'greater_or_equal_than': cond => getNodeValue(cond.elements[0]) >= getNodeValue(cond.elements[1]),
    'less_than': cond => getNodeValue(cond.elements[0]) < getNodeValue(cond.elements[1]),
    'less_or_equal_than': cond => getNodeValue(cond.elements[0]) <= getNodeValue(cond.elements[1]),
    'and': cond => checkCondition(cond.elements[0]) && checkCondition(cond.elements[1]),
    'or': cond => checkCondition(cond.elements[0]) || checkCondition(cond.elements[1]),
    'not': cond => !checkCondition(cond.elements[0]),
    'mult': cond => getNodeValue(cond.elements[0]) * getNodeValue(cond.elements[1]),
    'div': cond => getNodeValue(cond.elements[0]) / getNodeValue(cond.elements[1]),
    'sub': cond => getNodeValue(cond.elements[0]) - getNodeValue(cond.elements[1]),
    'add': cond => getNodeValue(cond.elements[0]) + getNodeValue(cond.elements[1]),
    'power': cond => getNodeValue(cond.elements[0]) ** getNodeValue(cond.elements[1]),
    'mod': cond => getNodeValue(cond.elements[0]) % getNodeValue(cond.elements[1]),
    'error': cond => { throw new Error(`Unknown expression "${cond.name}"`) }
  };

  const conditionHandlers = {
    'expression': condition => checkExpression(condition),
    'variable': condition => checkVariable(condition),
    'error': condition => { throw new Error(`Unknown condition type "${condition.type}"`) }
  };

  const operationHandlers = {
    'assign': (name, value) => mem.setVariable(name, value),
    'add_assign': (name, value) => mem.setVariable(name, mem.getVariable(name) + value),
    'sub_assign': (name, value) => mem.setVariable(name, mem.getVariable(name) - value),
    'error': (_n, _v, a) => { throw new Error(`Unknown operation "${a.operation}"`) }
  };

  const nodeValueHandlers = {
    'literal': node => node.value,
    'variable': node => mem.getVariable(node.name),
    'assignment': node => handleAssignement(node),
    'expression': node => checkExpression(node),
    'error': node => { throw new Error(`Unknown node "${node.type}"`) }
  };

  const handleAssignement = (assignment) => {
    const variable = assignment.variable;
    const source = assignment.value;
    const value = getNodeValue(source);

    return (operationHandlers[assignment.operation] || operationHandlers['error'])(variable.name, value, assignment);
  };

  const getNodeValue = (source) =>
    (nodeValueHandlers[source.type] || nodeValueHandlers['error'])(source);

  const checkCondition = (condition) =>
    (conditionHandlers[condition.type] || conditionHandlers['error'])(condition);

  const checkExpression = (condition) =>
    (expressionHandlers[condition.name] || expressionHandlers['error'])(condition);

  const checkVariable = (variable) => mem.getVariable(variable.name);

  return {
    checkCondition,
    handleAssignement,
    SPECIAL_VARIABLE_NAMES
  };
};

