export enum EventType {
  VARIABLE_CHANGED = 'variable_changed',
  EXTERNAL_VARIABLE_CHANGED = 'external_variable_changed',
  EVENT_TRIGGERED = 'event_triggered'
};

export interface EventsInstance {
  triggerEvent(name: EventType, data: any): void;
  addListener(name: EventType, callback: Function): Function;
  removeListener(name: EventType, callback: Function): void;
}

type ListenerList = { [event: string]: Function[] };

export function Events(): EventsInstance {
  const listeners: ListenerList = {
    [EventType.VARIABLE_CHANGED]: [],
    [EventType.EXTERNAL_VARIABLE_CHANGED]: [],
    [EventType.EVENT_TRIGGERED]: [],
  };

  return {
    triggerEvent(name: EventType, data: any) {
      listeners[name].forEach((l: Function) => l(data));
    },
    addListener(name: EventType, callback: Function): Function {
      listeners[name].push(callback);
      return callback;
    },
    removeListener(name: EventType, callback: Function) {
      const index = listeners[name].indexOf(callback);
      if (index === -1) {
        throw new Error('Listener not defined');
      }
      listeners[name].splice(index, 1);
    }
  }
}
