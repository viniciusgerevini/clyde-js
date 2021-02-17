export function LogicInterpreter(mem: any): {
    checkCondition: (condition: any) => any;
    handleAssignement: (assignment: any) => any;
    SPECIAL_VARIABLE_NAMES: string[];
};
