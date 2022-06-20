import { Events } from './events';
import { Memory } from './memory';
import { LogicInterpreter, LogicInterpreterInstance } from './logic_interpreter';

describe("Logic Interpreter", () => {
  let logic: LogicInterpreterInstance;

  beforeEach(() => {
    logic = LogicInterpreter(Memory(Events()));
  });

  it('throws when unknown condition', () => {
    const wrongCondition: any = { type: 'unknownType' };
    expect(() => logic.checkCondition(wrongCondition)).toThrow(/Unknown condition type "unknownType"/);
  });

  it('throws when unknown expression', () => {
    const wrongCondition: any = { type: 'expression', name: 'unknownExpression' };
    expect(() => logic.checkCondition(wrongCondition)).toThrow(/Unknown expression "unknownExpression"/);
  });

  it('throws when unknown expression', () => {
    const wrongAssignment: any = { operation: 'unknownOperation', variable: {}, value: { type: 'literal' } };
    expect(() => logic.handleAssignement(wrongAssignment)).toThrow(/Unknown operation "unknownOperation"/);
  });

  it('throws when unknown node', () => {
    const wrongAssignment: any = { operation: 'assign', variable: {}, value: { type: 'something'} };
    expect(() => logic.handleAssignement(wrongAssignment)).toThrow(/Unknown node "something"/);
  });
});
