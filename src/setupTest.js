import 'should';
import 'should-sinon';
import { stub } from 'sinon';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
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
