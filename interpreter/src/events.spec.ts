import { Events, EventsInstance, EventType } from './events';

describe('Events', () => {
  let listeners: EventsInstance;

  beforeEach(() => {
    listeners = Events();
  });

  it('add listener', (done) => {
    const expectedData = "something";

    listeners.addListener(EventType.VARIABLE_CHANGED, (data: any) => {
      expect(data).toEqual(expectedData);
      done();
    });

    listeners.triggerEvent(EventType.VARIABLE_CHANGED, expectedData);
  });

  it('remove listener', (done) => {
    const expectedData = "something";

    const callback = listeners.addListener(EventType.VARIABLE_CHANGED, () => {
      throw new Error('should not have triggered listener');
    });

    listeners.removeListener(EventType.VARIABLE_CHANGED, callback);

    listeners.triggerEvent(EventType.VARIABLE_CHANGED, expectedData);

    setTimeout(() => done(), 100);
  });

  it('throw error when removing wrong listener', () => {
    expect( () => {
      listeners.removeListener(EventType.VARIABLE_CHANGED, () => {})
    }).toThrow(/listener not defined/i);
  });
});
