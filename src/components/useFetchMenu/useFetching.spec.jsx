import React from 'react';
import { mount } from 'enzyme';
import fetchMock from 'fetch-mock';
import should from 'should';
import { useFakeTimers } from 'sinon';

import { setupRetryingRequestWithoutDelay } from '../../setupTest';
import { FETCHING_STATES } from './constants';
import { useFetchingCategories, useFetchingLocation } from './useFetching';

describe('useFetching', () => {
  setupRetryingRequestWithoutDelay();

  describe('useFetchingCategories', () => {
    const ChildComponent = () => <div />;
    const TestComponent = ({ authkey }) => {
      const [categories, fetchingState] = useFetchingCategories(authkey);
      return <ChildComponent categories={categories} fetchingState={fetchingState} />;
    };

    it('should fetch and return categories with fetching status', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key', [
        { categoryID: '1', name: 'Category 1' },
        { categoryID: '2', name: 'Category 2' },
      ]);
      const wrapper = mount(<TestComponent authkey='auth-key' />);

      const child = wrapper.find(ChildComponent);
      child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
      should(child.prop('categories')).be.null();

      setImmediate(() => {
        const { categories, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        categories.should.eql([
          { categoryID: '1', name: 'Category 1' },
          { categoryID: '2', name: 'Category 2' },
        ]);
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        fetchMock.restore();
        done();
      });
    });

    it('should return null with ERROR fetching status if failed to fetch categories', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key', 400);
      const wrapper = mount(<TestComponent authkey='auth-key' />);

      const child = wrapper.find(ChildComponent);
      child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
      should(child.prop('categories')).be.null();

      setImmediate(() => {
        const { categories, fetchingState } = wrapper.update().find(ChildComponent).props();
        should(categories).be.null();
        fetchingState.should.equal(FETCHING_STATES.ERROR);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        fetchMock.restore();
        done();
      });
    });

    it('should retry the request if needed', async (done) => {
      const repsonses = [502, 429, [{ categoryID: '1', name: 'Category 1' }]];
      let counter = 0;
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key',
        () => repsonses[counter++ % repsonses.length]
      );
      const wrapper = mount(<TestComponent authkey='auth-key' />);

      const child = wrapper.find(ChildComponent);
      child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
      should(child.prop('categories')).be.null();

      setTimeout(() => {
        const { categories, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        categories.should.eql([{ categoryID: '1', name: 'Category 1' }]);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(3);
        fetchMock.restore();
        done();
      }, 100);
    });

    it('should update the data every 5 minutes', (done) => {
      const repsonses = [[{ categoryID: '1', name: 'Category 1' }], [{ categoryID: '2', name: 'Category 2' }]];
      let counter = 0;
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key',
        () => repsonses[counter++ % repsonses.length]
      );
      const realSetTimeout = setTimeout;
      const clock = useFakeTimers(new Date());
      const wrapper = mount(<TestComponent authkey='auth-key' />);

      clock.tick(100);

      realSetTimeout(() => {
        const { categories, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        categories.should.eql([{ categoryID: '1', name: 'Category 1' }]);
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);

        clock.tick(5 * 60 * 1000 + 10);
        realSetTimeout(() => {
          wrapper
            .update()
            .find(ChildComponent)
            .prop('categories')
            .should.eql([{ categoryID: '2', name: 'Category 2' }]);
          fetchMock.restore();
          clock.restore();
          done();
        }, 50);
      }, 50);
    });

    it('should return null if no authKey', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key', [
        { categoryID: '1', name: 'Category 1' },
      ]);
      const wrapper = mount(<TestComponent />);

      setTimeout(() => {
        const { categories, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        should(categories).be.null();
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(0);
        fetchMock.restore();
        done();
      }, 50);
    });
  });

  describe('useFetchingLocation', () => {
    const ChildComponent = () => <div />;
    const TestComponent = ({ authkey, locationId }) => {
      const [location, fetchingState] = useFetchingLocation(authkey, locationId);
      return <ChildComponent location={location} fetchingState={fetchingState} />;
    };

    it('should fetch and return location with fetching status', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key', {
        shopID: '1',
        name: 'Raydiant (Engineering)',
        timeZone: 'America/Los_Angeles',
        timeStamp: '2021-07-22T01:46:13+00:00',
        priceLevelID: '1',
      });
      const wrapper = mount(<TestComponent authkey='auth-key' locationId='1' />);

      const child = wrapper.find(ChildComponent);
      child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
      should(child.prop('location')).be.null();

      setImmediate(() => {
        const { location, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        location.should.eql({
          shopID: '1',
          name: 'Raydiant (Engineering)',
          timeZone: 'America/Los_Angeles',
          timeStamp: '2021-07-22T01:46:13+00:00',
          priceLevelID: '1',
        });
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        fetchMock.restore();
        done();
      });
    });

    it('should return null with ERROR fetching status if failed to fetch location', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key', 400);
      const wrapper = mount(<TestComponent authkey='auth-key' locationId='1' />);

      const child = wrapper.find(ChildComponent);
      child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
      should(child.prop('location')).be.null();

      setImmediate(() => {
        const { location, fetchingState } = wrapper.update().find(ChildComponent).props();
        should(location).be.null();
        fetchingState.should.equal(FETCHING_STATES.ERROR);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        fetchMock.restore();
        done();
      });
    });

    it('should retry the request if needed', async (done) => {
      const repsonses = [502, 429, { shopID: '1', name: 'Raydiant (Engineering)' }];
      let counter = 0;
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key',
        () => repsonses[counter++ % repsonses.length]
      );
      const wrapper = mount(<TestComponent authkey='auth-key' locationId='1' />);

      setTimeout(() => {
        const { location, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        location.should.eql({ shopID: '1', name: 'Raydiant (Engineering)' });

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(3);
        fetchMock.restore();
        done();
      }, 100);
    });

    it('should update the data every 5 minutes', (done) => {
      const repsonses = [
        { shopID: '1', name: 'Raydiant (Engineering)' },
        { shopID: '1', name: 'Raydiant' },
      ];
      let counter = 0;
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key',
        () => repsonses[counter++ % repsonses.length]
      );
      const realSetTimeout = setTimeout;
      const clock = useFakeTimers(new Date());
      const wrapper = mount(<TestComponent authkey='auth-key' locationId='1' />);

      clock.tick(100);

      realSetTimeout(() => {
        const { location, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        location.should.eql({ shopID: '1', name: 'Raydiant (Engineering)' });
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);

        clock.tick(5 * 60 * 1000 + 10);
        realSetTimeout(() => {
          wrapper.update().find(ChildComponent).prop('location').should.eql({ shopID: '1', name: 'Raydiant' });
          fetchMock.restore();
          clock.restore();
          done();
        }, 50);
      }, 50);
    });

    it('should return null if for invalid locationId', (done) => {
      fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key', [
        { categoryID: '1', name: 'Category 1' },
      ]);
      const wrapper = mount(<TestComponent authkey='auth-key' locationId='none' />);

      setTimeout(() => {
        const { location, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        should(location).be.null();
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(0);
        fetchMock.restore();
        done();
      }, 50);
    });
  });
});
