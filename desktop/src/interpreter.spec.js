const { executeInterpreter } = require('./interpreter');

describe('CLI Interpreter', () => {
  describe('execute', () => {
    it('calls exit callback with status code when execution fails', (done) => {
      executeInterpreter(['file.clyde'], (errorCode) => {
        expect(typeof errorCode).toBe('number');
        done();
      });
    });
  });
});
