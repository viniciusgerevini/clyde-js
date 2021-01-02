import { Events } from './events.js';

describe('Events', () => {
  let listeners

  beforeEach(() => {
    listeners = Events();
  });

  it('add listener', (done) => {
    const expectedData = "something";

    listeners.addListener(listeners.events.VARIABLE_CHANGED, (data) => {
      expect(data).toEqual(expectedData);
      done();
    });

    listeners.triggerEvent(listeners.events.VARIABLE_CHANGED, expectedData);
  });

  it('remove listener', (done) => {
    const expectedData = "something";

    const callback = listeners.addListener(listeners.events.VARIABLE_CHANGED, () => {
      throw new Error('should not have triggered listener');
    });

    listeners.removeListener(listeners.events.VARIABLE_CHANGED, callback);

    listeners.triggerEvent(listeners.events.VARIABLE_CHANGED, expectedData);

    setTimeout(() => done(), 100);
  });

  it('throw error when removing wrong listener', () => {
    expect( () => {
      listeners.removeListener(listeners.events.VARIABLE_CHANGED, () => {})
    }).toThrow(/listener not defined/i);
  });
});
