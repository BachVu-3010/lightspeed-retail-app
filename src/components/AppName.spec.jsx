import React from 'react';
import { mount } from 'enzyme';
import { spy, useFakeTimers } from 'sinon';
import fetchMock from 'fetch-mock';

import { AppName } from './AppName';
import '../setupTest';

describe('AppName', () => {
  beforeEach(() => {
    fetchMock.mock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should render app with correct values', () => {
    const onReady = spy();
    const wrapper = mount(<AppName presentation={{ values: { duration: 120 } }} onReady={onReady} />);

    wrapper.find('main').find('h1').text().should.equal('RaydiantKit');
    wrapper.find('main').find('h2').text().should.equal('Screen signage SDK');
    onReady.should.be.calledOnce();
  });

  it('should call onComplete after duration', () => {
    const clock = useFakeTimers(new Date());
    const onReady = spy();
    const onComplete = spy();
    const wrapper = mount(
      <AppName
        presentation={{
          values: {
            duration: 40,
          },
        }}
        isPlaying={false}
        onComplete={onComplete}
        onReady={onReady}
      />
    );
    // Do not call onComplete when isPlaying is false
    clock.tick(40 * 1000 + 100);
    onReady.should.be.calledOnce();
    onComplete.should.not.be.called();

    // Call onComplete when isPlaying is true
    wrapper.setProps({
      isPlaying: true,
    });

    onComplete.should.not.be.called();
    clock.tick(40 * 1000 - 100);
    onComplete.should.not.be.called();
    clock.tick(200);
    onComplete.should.be.calledOnce();

    clock.restore();
  });
});
