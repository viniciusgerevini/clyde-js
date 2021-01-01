const SPECIAL_VARIABLE_NAMES = [ 'OPTIONS_COUNT' ];

function Memory(init) {
  const mem = init || {
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
  };
};

module.exports = Memory;