import React from 'react';
import { shallow } from 'enzyme';

import '../setupTest';
import Loading from './Loading';

describe('Loading', () => {
  it('should render a loading spinner with a title', () => {
    const wrapper = shallow(<Loading title='Loading ...'>Test Description</Loading>);

    const container = wrapper.find('.loading-overlay');
    container.find('.loading-spinner').exists().should.be.true();
    container.find('.loading-title').text().should.equal('Loading ...');
    container.find('.loading-description').text().should.equal('Test Description');
  });
});
