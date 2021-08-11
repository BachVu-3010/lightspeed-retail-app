import fetchMock from 'fetch-mock';
import should from 'should';

import { setupRetryingRequestWithoutDelay } from '../../setupTest';
import fetchWithRetries from './fetchWithRetries';

describe('fetchWithRetries', () => {
  setupRetryingRequestWithoutDelay();

  it('should send the request and return data', async () => {
    const testUrl = 'http://lvh.me/test-url';
    fetchMock.mock(testUrl, { message: 'OK' });

    (await fetchWithRetries(testUrl)).should.eql({ message: 'OK' });
    fetchMock.calls('http://lvh.me/test-url').should.have.length(1);
    fetchMock.restore();
  });

  it('should not retry with 502 and 429 errors', async () => {
    const repsonses = [502, 429, { message: 'OK' }];
    const testUrl = 'http://lvh.me/test-url-retry';
    let counter = 0;
    fetchMock.mock(testUrl, () => repsonses[counter++ % repsonses.length]);

    (await fetchWithRetries(testUrl)).should.eql({ message: 'OK' });
    fetchMock.calls('http://lvh.me/test-url-retry').should.have.length(3);
    fetchMock.restore();
  });

  it('should not retry with 502 and 429 errors', async () => {
    const repsonses = [400, { message: 'OK' }];
    const testUrl = 'http://lvh.me/test-url-not-retry';
    let counter = 0;
    fetchMock.mock(testUrl, () => repsonses[counter++ % repsonses.length]);

    should(await fetchWithRetries(testUrl)).be.null();
    fetchMock.calls('http://lvh.me/test-url-not-retry').should.have.length(1);
    fetchMock.restore();
  });

  it('should not retry at most 3 times', async () => {
    const repsonses = [502, 502, 502, { message: 'OK' }];
    const testUrl = 'http://lvh.me/test-url-retry-at-most-3-times';
    let counter = 0;
    fetchMock.mock(testUrl, () => repsonses[counter++ % repsonses.length]);

    should(await fetchWithRetries(testUrl)).be.null();
    fetchMock.calls('http://lvh.me/test-url-retry-at-most-3-times').should.have.length(3);
    fetchMock.restore();
  });
});
