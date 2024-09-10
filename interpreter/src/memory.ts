import { EventType, EventsInstance } from './events';

const SPECIAL_VARIABLE_NAMES = [ 'OPTIONS_COUNT' ];
const EXTERNAL_VARIABLE_PREFIX = '@';

export type InternalMemory = {
  access: any;
  variables: any;
  internal: any;
}

export type DialogueData = Omit<InternalMemory, "e_variables">;

export interface MemoryManager {
    setAsAccessed(id: string): void;
    wasAlreadyAccessed(id: string): boolean;
    getVariable<T>(id: string, defaultValue?: T): T;
    setVariable<T>(id: string, value: T): T;
    getExternalVariable<T>(id: string): T;
    setExternalVariable<T>(id: string, value: T): T;
    setInternalVariable<T>(id: string, value: T): T;
    getInternalVariable<T>(id: string, defaultValue?: T): T;
    onExternalVariableFetch(callback: ((name: string) => any) | undefined): void;
    onExternalVariableUpdate(callback: ((name: string, value: any) => void) | undefined): void;
    getAll(): DialogueData;
    load(data: DialogueData): void;
    clear(): void;
}

export function Memory(listeners: EventsInstance, init?: InternalMemory): MemoryManager {
  let onExternalVariableUpdateCallback: Function | undefined;
  let onExternalVariableFetchCallback: Function | undefined;

  let mem: InternalMemory = init || {
    access: {},
    variables: {},
    internal: {},
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

      if (id.startsWith(EXTERNAL_VARIABLE_PREFIX)) {
        return this.getExternalVariable(id);
      }

      const value = mem.variables[id];
      if (value === undefined) {
        return defaultValue;
      }
      return value;
    },

    setVariable<T>(id: string, value: T): T {
      if (id.startsWith(EXTERNAL_VARIABLE_PREFIX)) {
        return this.setExternalVariable(id, value);
      }

      listeners.triggerEvent(EventType.VARIABLE_CHANGED, { name: id, value, previousValue: mem.variables[id] });
      return mem.variables[id] = value;
    },

    getExternalVariable(id: string): any {
      const sanitizedId = id.replace(EXTERNAL_VARIABLE_PREFIX, "");

      let value: any;

      if (onExternalVariableFetchCallback) {
        value = onExternalVariableFetchCallback(sanitizedId);
      }

      return value;
    },

    setExternalVariable<T>(id: string, value: T): T {
      const sanitizedId = id.replace(EXTERNAL_VARIABLE_PREFIX, "");

      if (onExternalVariableUpdateCallback) {
        onExternalVariableUpdateCallback(sanitizedId, value);
      }

      return value;
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

    getAll(): DialogueData {
      return {
        variables: mem.variables,
        access: mem.access,
        internal: mem.internal,
      };
    },

    load(data: DialogueData): void {
      mem = {
        ...data,
      };
    },

    clear(): void {
      mem = {
        access: {},
        variables: {},
        internal: {},
      };
    },
    onExternalVariableFetch(callback: ((name: string) => any) | undefined): void {
      onExternalVariableFetchCallback = callback;
    },
    onExternalVariableUpdate(callback: ((name: string, value: any) => void) | undefined): void {
      onExternalVariableUpdateCallback = callback;
    }
  };
};

