import React from 'react';
import { mount } from 'enzyme';
import fetchMock from 'fetch-mock';
import { useFakeTimers } from 'sinon';

import { setupRetryingRequestWithoutDelay } from '../../setupTest';
import { FETCHING_STATES } from './constants';
import useFetchingCachingItems from './useFetchingCachingItems';

describe('useFetchingCachingItems', () => {
  setupRetryingRequestWithoutDelay();

  beforeEach(() => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2&offset=0', {
      items: [],
      pagination: { count: '0', offset: '0', limit: '100' },
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=3&offset=0', {
      items: [],
      pagination: { count: '0', offset: '0', limit: '100' },
    });
  });

  const ChildComponent = () => <div />;
  const TestComponent = ({ authkey, categoryIds }) => {
    const [itemsByCategory, fetchingState] = useFetchingCachingItems(authkey, categoryIds);
    return <ChildComponent itemsByCategory={itemsByCategory} fetchingState={fetchingState} />;
  };

  it('should fetch and return items with fetching status', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0', {
      items: [
        { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
        { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
      ],
      pagination: { count: '2', offset: '0', limit: '100' },
    });
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({
        1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
        2: [{ itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] }],
      });
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(1);
      fetchMock.restore();
      done();
    });
  });

  it('should fetch matrix and merge matrix items', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=10,20&offset=0', {
      items: [
        { itemID: '1', description: 'Item 1', categoryID: '10', itemMatrixID: '0', Prices: [] },
        { itemID: '2', description: 'T-shirt Size S', categoryID: '20', itemMatrixID: '1', Prices: [] },
        { itemID: '3', description: 'Item 3', categoryID: '30', itemMatrixID: '0', Prices: [] },
        { itemID: '4', description: 'T-shirt 2 Size L', categoryID: '10', itemMatrixID: '2', Prices: [] },
        { itemID: '5', description: 'T-shirt Size L Color blue', categoryID: '20', itemMatrixID: '1', Prices: [] },
        { itemID: '6', description: 'T-shirt 2 Size M', categoryID: '10', itemMatrixID: '2', Prices: [] },
      ],
      pagination: { count: '6', offset: '0', limit: '100' },
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=10,20&offset=0', {
      items: [
        { itemMatrixID: '1', description: 'T-shirt', categoryID: '20' },
        { itemMatrixID: '2', description: 'T-shirt 2', categoryID: '10' },
      ],
      pagination: { count: '2', offset: '0', limit: '100' },
    });

    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['10', '20']} />);
    setImmediate(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({
        10: [
          { itemID: '1', description: 'Item 1', categoryID: '10', itemMatrixID: '0', Prices: [] },
          {
            itemID: 'matrix-2',
            description: 'T-shirt 2',
            categoryID: '10',
            variants: [
              { itemID: '4', description: 'Size L', categoryID: '10', itemMatrixID: '2', Prices: [] },
              { itemID: '6', description: 'Size M', categoryID: '10', itemMatrixID: '2', Prices: [] },
            ],
          },
        ],
        20: [
          {
            itemID: 'matrix-1',
            description: 'T-shirt',
            categoryID: '20',
            variants: [
              { itemID: '2', description: 'Size S', categoryID: '20', itemMatrixID: '1', Prices: [] },
              { itemID: '5', description: 'Size L Color blue', categoryID: '20', itemMatrixID: '1', Prices: [] },
            ],
          },
        ],
        30: [{ itemID: '3', description: 'Item 3', categoryID: '30', itemMatrixID: '0', Prices: [] }],
      });
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=10,20&offset=0')
        .should.have.length(1);
      fetchMock.restore();
      done();
    });
  });

  it('should return null with ERROR fetching status if failed to fetch categories', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0', 400);
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      itemsByCategory.should.eql({});
      fetchingState.should.equal(FETCHING_STATES.ERROR);

      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(1);
      fetchMock.restore();
      done();
    });
  });

  it('should retry the request if needed', async (done) => {
    const repsonses = [
      502,
      429,
      {
        items: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
        pagination: { count: '1', offset: '0', limit: '100' },
      },
    ];
    let counter = 0;
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0',
      () => repsonses[counter++ % repsonses.length]
    );
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setTimeout(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({
        1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
        2: [],
      });

      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(3);
      fetchMock.restore();
      done();
    }, 100);
  });

  it('should update the data every 5 minutes', (done) => {
    const repsonses = [
      {
        items: [],
        pagination: { count: '0', offset: '0', limit: '100' },
      },
      {
        items: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0' }],
        pagination: { count: '1', offset: '0', limit: '100' },
      },
    ];
    let counter = 0;
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0',
      () => repsonses[counter++ % repsonses.length]
    );
    const realSetTimeout = setTimeout;
    const clock = useFakeTimers(new Date());
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    clock.tick(100);

    realSetTimeout(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({ 1: [], 2: [] });
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(1);

      clock.tick(5 * 60 * 1000 + 10);
      realSetTimeout(() => {
        wrapper
          .update()
          .find(ChildComponent)
          .prop('itemsByCategory')
          .should.eql({ 1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0' }], 2: [] });
        fetchMock.restore();
        clock.restore();
        done();
      }, 50);
    }, 50);
  });

  it('should return empty if no authKey', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0', {
      items: [
        { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
        { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
      ],
      pagination: { count: '2', offset: '0', limit: '100' },
    });
    const wrapper = mount(<TestComponent categoryIds={['1', '2']} />);

    setTimeout(() => {
      wrapper.update().find(ChildComponent).prop('itemsByCategory').should.eql({});
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(0);
      fetchMock.restore();
      done();
    }, 50);
  });

  it('should fetch missing items when categoryIds change', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0', {
      items: [
        { itemID: '1', description: 'Item 1', categoryID: '1' },
        { itemID: '2', description: 'Item 2', categoryID: '1' },
        { itemID: '3', description: 'Item 3', categoryID: '2' },
        { itemID: '4', description: 'Item 4', categoryID: '2' },
      ],
      pagination: { count: '4', offset: '0', limit: '100' },
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=3&offset=0', {
      items: [{ itemID: '5', description: 'Item 5', categoryID: '3' }],
      pagination: { count: '1', offset: '0', limit: '100' },
    });
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    setTimeout(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({
        1: [
          { itemID: '1', description: 'Item 1', categoryID: '1' },
          { itemID: '2', description: 'Item 2', categoryID: '1' },
        ],
        2: [
          { itemID: '3', description: 'Item 3', categoryID: '2' },
          { itemID: '4', description: 'Item 4', categoryID: '2' },
        ],
      });
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(1);

      wrapper.setProps({ categoryIds: ['1', '3'] });

      setTimeout(() => {
        wrapper
          .update()
          .find(ChildComponent)
          .prop('itemsByCategory')
          .should.eql({
            1: [
              { itemID: '1', description: 'Item 1', categoryID: '1' },
              { itemID: '2', description: 'Item 2', categoryID: '1' },
            ],
            2: [
              { itemID: '3', description: 'Item 3', categoryID: '2' },
              { itemID: '4', description: 'Item 4', categoryID: '2' },
            ],
            3: [{ itemID: '5', description: 'Item 5', categoryID: '3' }],
          });

        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=3&offset=0')
          .should.have.length(1);

        fetchMock.restore();
        done();
      }, 50);
    }, 50);
  });

  it('should fetch all items by multiple requests', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0', {
      items: [
        { itemID: '1', description: 'Item 1', categoryID: '1' },
        { itemID: '2', description: 'Item 2', categoryID: '1' },
        { itemID: '3', description: 'Item 3', categoryID: '2' },
        { itemID: '4', description: 'Item 4', categoryID: '2' },
      ],
      pagination: { count: '6', offset: '0', limit: '4' },
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=4', {
      items: [
        { itemID: '5', description: 'Item 5', categoryID: '2' },
        { itemID: '6', description: 'Item 6', categoryID: '1' },
      ],
      pagination: { count: '6', offset: '4', limit: '4' },
    });
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    setTimeout(() => {
      const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
      fetchingState.should.equal(FETCHING_STATES.OK);
      itemsByCategory.should.eql({
        1: [
          { itemID: '1', description: 'Item 1', categoryID: '1' },
          { itemID: '2', description: 'Item 2', categoryID: '1' },
          { itemID: '6', description: 'Item 6', categoryID: '1' },
        ],
        2: [
          { itemID: '3', description: 'Item 3', categoryID: '2' },
          { itemID: '4', description: 'Item 4', categoryID: '2' },
          { itemID: '5', description: 'Item 5', categoryID: '2' },
        ],
      });
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=0')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&offset=4')
        .should.have.length(1);

      fetchMock.restore();
      done();
    }, 50);
  });
});
