import {
  saveState,
  loadState,
  clearState,
  APP_LOCAL_STORAGE_KEY
} from './local-storage';


describe('Local Storage persistence', () => {
  const localStorageSetItemMock = jest.spyOn(window.localStorage.__proto__, 'setItem');
  const localStorageGetItemMock = jest.spyOn(window.localStorage.__proto__, 'getItem');
  const localStorageRemoveItemMock = jest.spyOn(window.localStorage.__proto__, 'removeItem');

  beforeEach(() => {
    localStorageSetItemMock.mockClear();
    localStorageGetItemMock.mockClear();
    localStorageRemoveItemMock.mockClear();
  });

  describe('#saveState', () => {
    it('saves to local storage', () => {
      const state = { hello: 'hi' };

      saveState(state);

      expect(localStorageSetItemMock)
        .toHaveBeenCalledWith(APP_LOCAL_STORAGE_KEY, JSON.stringify(state));
    });

    it('does not fail when save operation fails', () => {
      const state = { hello: 'hi' };

      localStorageSetItemMock.mockImplementation(() => {
        throw new Error('This error should have been handled');
      });

      expect(() => saveState(state)).not.toThrow();
    });
  });

  describe('#loadState', () => {
    it('loads state from storage', () => {
      localStorageGetItemMock.mockReturnValue('{ "notes": [] }');

      expect(loadState()).toEqual({ notes: [] });
      expect(localStorageGetItemMock).toHaveBeenCalledWith(APP_LOCAL_STORAGE_KEY);
    });

    it('returns undefined when no value persisted', () => {
      localStorageGetItemMock.mockReturnValue(null);
      expect(loadState()).toEqual(undefined);
    });

    it('returns undefined when load fails', () => {
      localStorageGetItemMock.mockImplementation(() => {
        throw new Error('This error should have been handled');
      });

      expect(loadState()).not.toBeDefined();
    });
  });

  describe('#clearState', () => {
    it('erases state from local storage', () => {
      clearState();
      expect(localStorageRemoveItemMock).toHaveBeenCalledWith(APP_LOCAL_STORAGE_KEY);
    });

    it('does not fail when erase operation fails', () => {
      localStorageRemoveItemMock.mockImplementation(() => {
        throw new Error('This error should have been handled');
      });

      expect(() => clearState()).not.toThrow();
    });
  });
});
