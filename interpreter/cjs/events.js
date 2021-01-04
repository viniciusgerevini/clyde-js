'use strict';
const events = {
  VARIABLE_CHANGED: 'variable_changed',
  EVENT_TRIGGERED: 'event_triggered'
};
exports.events = events;

function Events() {
  const listeners = {
    [events.VARIABLE_CHANGED]: [],
    [events.EVENT_TRIGGERED]: [],
  };

  return {
    events,
    triggerEvent(name, data) {
      listeners[name].forEach(l => l(data));
    },
    addListener(name, callback) {
      listeners[name].push(callback);
      return callback;
    },
    removeListener(name, callback) {
      const index = listeners[name].indexOf(callback);
      if (index === -1) {
        throw new Error('Listener not defined');
      }
      listeners[name].splice(index, 1);
    }
  }
}
exports.Events = Events
