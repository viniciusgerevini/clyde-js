
const LogicInterpreter = (mem) => {

  const handleAssignement = (assignment) => {
    const variable = assignment.variable;
    const source = assignment.value;

    let value = getNodeValue(source);

    if (assignment.operation === 'assign') {
      mem.variables[variable.name] = value;
    } else if (assignment.operation === 'add_assign') {
      mem.variables[variable.name] += value;
    } else if (assignment.operation === 'sub_assign') {
      mem.variables[variable.name] -= value;
    } else {
      throw new Error(`Unknown operation "${assignment.operation}"`)
    }

    return mem.variables[variable.name];
  };

  const getNodeValue = (source) => {
    if (source.type === 'literal') {
      return source.value;
    }
    if (source.type === 'variable') {
      return mem.variables[source.name];
    }
    if (source.type === 'assignment') {
      return handleAssignement(source);
    }
  };

  const checkCondition = (condition) => {
    if (condition.type === 'expression') {
      return checkExpression(condition);
    }

    if (condition.type === 'variable') {
      return checkVariable(condition);
    }
    throw new Error(`Unknown condition type "${condition.type}"`);
  }

  const checkExpression = (condition) => {
    if (condition.name === 'equal') {
      return getNodeValue(condition.elements[0]) === getNodeValue(condition.elements[1]);
    }
    if (condition.name === 'not_equal') {
      return getNodeValue(condition.elements[0]) !== getNodeValue(condition.elements[1]);
    }
    if (condition.name === 'greater_than') {
      return getNodeValue(condition.elements[0]) > getNodeValue(condition.elements[1]);
    }
    if (condition.name === 'greater_or_equal_than') {
      return getNodeValue(condition.elements[0]) >= getNodeValue(condition.elements[1]);
    }
    if (condition.name === 'less_than') {
      return getNodeValue(condition.elements[0]) < getNodeValue(condition.elements[1]);
    }
    if (condition.name === 'less_or_equal_than') {
      return getNodeValue(condition.elements[0]) <= getNodeValue(condition.elements[1]);
    }

    if (condition.name === 'and') {
      return checkCondition(condition.elements[0]) && checkCondition(condition.elements[1]);
    }

    if (condition.name === 'or') {
      return checkCondition(condition.elements[0]) || checkCondition(condition.elements[1]);
    }

    if (condition.name === 'not') {
      return !checkCondition(condition.elements[0]);
    }
    throw new Error(`Unknown expression "${condition.name}"`);
  }

  const checkVariable = (variable) => {
    return mem.variables[variable.name];
  };

  return {
    checkCondition,
    handleAssignement
  };
};

module.exports = LogicInterpreter;
