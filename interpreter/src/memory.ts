import { EventType, EventsInstance } from './events';

const SPECIAL_VARIABLE_NAMES = [ 'OPTIONS_COUNT' ];

export type InternalMemory = {
  access: any;
  variables: any;
  internal: any;
}

export interface MemoryManager {
    setAsAccessed(id: string): void;
    wasAlreadyAccessed(id: string): boolean;
    getVariable<T>(id: string, defaultValue?: T): T;
    setVariable<T>(id: string, value: T): T;
    setInternalVariable<T>(id: string, value: T): T;
    getInternalVariable<T>(id: string, defaultValue?: T): T;
    getAll(): InternalMemory;
    load(data: InternalMemory): void;
    clear(): void;
}

export function Memory(listeners: EventsInstance, init?: InternalMemory): MemoryManager {
  let mem: InternalMemory = init || {
    access: {},
    variables: {},
    internal: {}
  };

  return {
    setAsAccessed(id: string): void {
      mem.access[id] = true;
    },

    wasAlreadyAccessed(id: string): boolean {
      return !!mem.access[id];
    },

    getVariable(id: string, defaultValue?: any): any {
      if (SPECIAL_VARIABLE_NAMES.includes(id)) {
        return this.getInternalVariable(id, defaultValue);
      }

      const value = mem.variables[id];
      if (value === undefined) {
        return defaultValue;
      }
      return value;
    },

    setVariable<T>(id: string, value: T): T {
      listeners.triggerEvent(EventType.VARIABLE_CHANGED, { name: id, value, previousValue: mem.variables[id] });
      return mem.variables[id] = value;
    },

    setInternalVariable<T>(id: string, value: T): T {
      return mem.internal[id] = value;
    },

    getInternalVariable(id: string, defaultValue?: any): any {
      const value = mem.internal[id];
      if (value === undefined) {
        return defaultValue;
      }
      return value;
    },

    getAll(): InternalMemory {
      return mem;
    },

    load(data: InternalMemory): void {
      mem = data;
    },

    clear(): void {
      mem = {
        access: {},
        variables: {},
        internal: {}
      };
    },
  };
};

