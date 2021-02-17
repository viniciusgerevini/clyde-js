export function Memory(listeners: any, init: any): {
    setAsAccessed(id: any): void;
    wasAlreadyAccessed(id: any): boolean;
    getVariable(id: any, defaultValue: any): any;
    setVariable(id: any, value: any): any;
    setInternalVariable(id: any, value: any): any;
    getInternalVariable(id: any, defaultValue: any): any;
    getAll(): any;
    load(data: any): void;
    clear(): void;
};
