'use strict';
const SPECIAL_VARIABLE_NAMES = [ 'OPTIONS_COUNT' ];

function Memory(listeners, init) {
  let mem = init || {
    access: {},
    variables: {},
    internal: {}
  };

  return {
    setAsAccessed(id) {
      mem.access[id] = true;
    },

    wasAlreadyAccessed(id) {
      return !!mem.access[id];
    },

    getVariable(id, defaultValue) {
      if (SPECIAL_VARIABLE_NAMES.includes(id)) {
        return this.getInternalVariable(id, defaultValue);
      }

      const value = mem.variables[id];
      if (value === undefined) {
        return defaultValue;
      }
      return value;
    },

    setVariable(id, value) {
      listeners.triggerEvent(listeners.events.VARIABLE_CHANGED, { name: id, value });
      return mem.variables[id] = value;
    },

    setInternalVariable(id, value) {
      return mem.internal[id] = value;
    },

    getInternalVariable(id, defaultValue) {
      const value = mem.internal[id];
      if (value === undefined) {
        return defaultValue;
      }
      return value;
    },

    getAll() {
      return mem;
    },

    load(data) {
      mem = data;
    },

    clear() {
      mem = {
        access: {},
        variables: {},
        internal: {}
      };
    },
  };
}
exports.Memory = Memory;

