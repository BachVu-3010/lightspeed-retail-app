import 'should';
import 'should-sinon';
import { stub } from 'sinon';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import * as ExpBackoff from 'exponential-backoff';

import logger from './utils/logger';

Enzyme.configure({ adapter: new Adapter() });

const matchMediaAddListenerStub = stub();
const matchMediaRemoveListenerStub = stub();
const matchMediaEventListenerStub = stub().throws(
  'Potential issue for Safari',
  'Safari does not support event listeners for media queries. Use "addLisenter" and "removeListener" instead.\nDetail here: https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList'
);
window.matchMedia = stub().returns({
  addListener: matchMediaAddListenerStub,
  removeListener: matchMediaRemoveListenerStub,
  addEventListener: matchMediaEventListenerStub,
  removeEventListener: matchMediaEventListenerStub,
});

beforeAll(() => {
  stub(logger, 'debug');
  stub(logger, 'info');
  stub(logger, 'warn');
  stub(logger, 'error');
});

afterEach(() => {
  matchMediaAddListenerStub.resetHistory();
  matchMediaRemoveListenerStub.resetHistory();
});

process.env.RAYDIANT_APP_LS_RETAIL_BASE_URL = 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL';

// Ignore unexpected warnings, there is no proper solution for this issue
// https://github.com/enzymejs/enzyme/issues/2073#issuecomment-515817947
const mockConsoleMethod = (realConsoleMethod) => {
  const ignoredMessages = ['test was not wrapped in act(...)'];

  return (message, ...args) => {
    const containsIgnoredMessage = ignoredMessages.some((ignoredMessage) => message.includes(ignoredMessage));

    if (!containsIgnoredMessage) {
      realConsoleMethod(message, ...args);
    }
  };
};
console.warn = jest.fn(mockConsoleMethod(console.warn));
console.error = jest.fn(mockConsoleMethod(console.error));

export const setupRetryingRequestWithoutDelay = () => {
  beforeAll(() => {
    const realBackOff = ExpBackoff.backOff;
    stub(ExpBackoff, 'backOff').callsFake(
      async (fn) =>
        await realBackOff(fn, {
          numOfAttempts: 3,
          startingDelay: 1,
          timeMultiple: 1,
        })
    );
  });

  afterAll(() => {
    ExpBackoff.backOff.restore();
  });
};
