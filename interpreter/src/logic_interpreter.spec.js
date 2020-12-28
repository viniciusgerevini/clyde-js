const LogicInterpreter = require('./logic_interpreter');
describe("Logic Interpreter", () => {
  let logic;

  beforeEach(() => {
    const mem = {
      variables: {}
    };
    logic = LogicInterpreter(mem);
  });

  it('throws when unknown condition', () => {
    const wrongCondition = { type: 'unknownType' };
    expect(() => logic.checkCondition(wrongCondition)).toThrow(/Unknown condition type "unknownType"/);
  });

  it('throws when unknown expression', () => {
    const wrongCondition = { type: 'expression', name: 'unknownExpression' };
    expect(() => logic.checkCondition(wrongCondition)).toThrow(/Unknown expression "unknownExpression"/);
  });

  it('throws when unknown expression', () => {
    const wrongAssignment = { operation: 'unknownOperation', variable: {}, value: { type: 'literal' } };
    expect(() => logic.handleAssignement(wrongAssignment)).toThrow(/Unknown operation "unknownOperation"/);
  });

  it('throws when unknown node', () => {
    const wrongAssignment = { operation: 'assign', variable: {}, value: { type: 'something'} };
    expect(() => logic.handleAssignement(wrongAssignment)).toThrow(/Unknown node "something"/);
  });
});
