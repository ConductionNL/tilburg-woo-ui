import { AcLogFetchError } from './ac-log-fetch-error';

describe('AcLogFetchError', () => {
  let infoSpy;
  let errorSpy;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('a missing object is not a fault', () => {
    it('recognises the store\'s isNotFound tag', () => {
      const result = AcLogFetchError('Fetching organisation', { isNotFound: true });

      expect(result).toBe(true);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    // Not every caller goes through the object store; some components call the
    // API directly and get a plain axios error with no tag on it. Relying on
    // the tag alone let a 404 through as an error from exactly those paths.
    it('recognises a raw axios 404 that carries no tag', () => {
      const result = AcLogFetchError('Fetching organisation', {
        response: { status: 404 },
      });

      expect(result).toBe(true);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('names what was being fetched, so the line is readable on its own', () => {
      AcLogFetchError('Fetching organisation', { isNotFound: true });

      expect(infoSpy.mock.calls[0][0]).toContain('Fetching organisation');
    });
  });

  describe('anything else is still a genuine error', () => {
    it.each([
      ['a 500', { response: { status: 500 } }],
      ['a 403', { response: { status: 403 } }],
      ['a network failure with no response', new Error('Network Error')],
      ['an undefined error', undefined],
    ])('reports %s as an error', (_label, error) => {
      const result = AcLogFetchError('Fetching organisation', error);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('passes the original error through so the stack survives', () => {
      const error = new Error('boom');

      AcLogFetchError('Fetching organisation', error);

      expect(errorSpy.mock.calls[0][1]).toBe(error);
    });
  });
});
