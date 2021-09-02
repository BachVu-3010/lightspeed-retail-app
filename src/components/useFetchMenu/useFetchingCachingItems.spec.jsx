import React from 'react';
import { mount } from 'enzyme';
import fetchMock from 'fetch-mock';
import { useFakeTimers, spy } from 'sinon';

import { setupRetryingRequestWithoutDelay } from '../../setupTest';
import { FETCHING_STATES } from './constants';
import useFetchingCachingItems from './useFetchingCachingItems';

describe('useFetchingCachingItems', () => {
  setupRetryingRequestWithoutDelay();

  beforeEach(() => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2&item_ids=', []);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=3&item_ids=', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  const ChildComponent = () => <div />;
  const TestComponent = ({ authkey, categoryIds, itemIds = [], tags, onError = () => {} }) => {
    const [itemsByCategory, fetchingState] = useFetchingCachingItems(authkey, categoryIds, itemIds, tags, onError);
    return <ChildComponent itemsByCategory={itemsByCategory} fetchingState={fetchingState} />;
  };

  it('should fetch and return items with fetching status', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 2,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
      { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
    ]);
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        itemsByCategory.should.eql({
          1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
          2: [{ itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] }],
        });
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
          .should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=')
          .should.have.length(1);
        done();
      });
    });
  });

  it('should fetch matrix and merge matrix items', (done) => {
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=10,20,30&item_ids=',
      { count: 8 }
    );
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=10,20,30&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '10', itemMatrixID: '0', Prices: [] },
      { itemID: '2', description: 'T-shirt Size S', categoryID: '20', itemMatrixID: '1', Prices: [] },
      { itemID: '3', description: 'Item 3', categoryID: '30', itemMatrixID: '0', Prices: [] },
      { itemID: '4', description: 'T-shirt 2 Size L', categoryID: '10', itemMatrixID: '2', Prices: [] },
      { itemID: '5', description: 'T-shirt Size L Color blue', categoryID: '20', itemMatrixID: '1', Prices: [] },
      { itemID: '6', description: 'T-shirt 2 Size M', categoryID: '10', itemMatrixID: '2', Prices: [] },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=10,20,30&item_ids=', [
      { itemMatrixID: '1', description: 'T-shirt', categoryID: '20' },
      { itemMatrixID: '2', description: 'T-shirt 2', categoryID: '10' },
    ]);

    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['10', '20', '30']} />);
    setImmediate(() => {
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
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=10,20,30&item_ids=')
          .should.have.length(1);
        done();
      });
    });
  });

  it('should return null with ERROR fetching status if failed to fetch categories', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 10,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=', 400);
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        itemsByCategory.should.eql({});
        fetchingState.should.equal(FETCHING_STATES.ERROR);

        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
          .should.have.length(1);
        done();
      });
    });
  });

  it('should retry the request if needed', async (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 1,
    });
    const repsonses = [
      502,
      429,
      [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
    ];
    let counter = 0;
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=',
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
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
        .should.have.length(3);
      done();
    }, 100);
  });

  it('should update the data every 5 minutes', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 1,
    });
    const repsonses = [[], [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0' }]];
    let counter = 0;
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=',
      () => repsonses[counter++ % repsonses.length]
    );
    const realSetTimeout = setTimeout;
    const clock = useFakeTimers(new Date());
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} />);

    realSetTimeout(() => {
      clock.tick(100);
      realSetTimeout(() => {
        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        itemsByCategory.should.eql({ 1: [], 2: [] });
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
          .should.have.length(1);

        clock.tick(5 * 60 * 1000 + 10);
        realSetTimeout(() => {
          wrapper
            .update()
            .find(ChildComponent)
            .prop('itemsByCategory')
            .should.eql({ 1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0' }], 2: [] });
          clock.restore();
          done();
        }, 50);
      }, 50);
    }, 50);
  });

  it('should return empty if no authKey', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 2,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
      { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
    ]);
    const wrapper = mount(<TestComponent categoryIds={['1', '2']} />);

    setTimeout(() => {
      wrapper.update().find(ChildComponent).prop('itemsByCategory').should.eql({});
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
        .should.have.length(0);
      done();
    }, 50);
  });

  it('should fetch missing items when categoryIds change', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=', {
      count: 4,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,3&item_ids=', {
      count: 3,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1' },
      { itemID: '2', description: 'Item 2', categoryID: '1' },
      { itemID: '3', description: 'Item 3', categoryID: '2' },
      { itemID: '4', description: 'Item 4', categoryID: '2' },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=3&item_ids=', [
      { itemID: '5', description: 'Item 5', categoryID: '3' },
    ]);
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
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=')
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
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=3&item_ids=')
          .should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,3&item_ids=')
          .should.have.length(1);

        done();
      }, 50);
    }, 50);
  });

  it('should fetch items by item IDs', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1&item_ids=2,3', {
      count: 3,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1&item_ids=2,3', [
      { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
      { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
      { itemID: '3', description: 'Item 3', categoryID: '2', itemMatrixID: '0', Prices: [] },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1&item_ids=2,3', []);

    const onError = spy();
    const wrapper = mount(
      <TestComponent authkey='auth-key' categoryIds={['1']} itemIds={['2', '3']} onError={onError} />
    );

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        onError.should.not.be.called();

        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        itemsByCategory.should.eql({
          1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
          2: [
            { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
            { itemID: '3', description: 'Item 3', categoryID: '2', itemMatrixID: '0', Prices: [] },
          ],
        });
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1&item_ids=2,3')
          .should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1&item_ids=2,3')
          .should.have.length(1);
        done();
      });
    });
  });

  it('should fire onError if too many items', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=666&item_ids=', {
      count: 201,
    });
    const onError = spy();
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['666']} onError={onError} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        onError.should.be.calledOnce();
        onError
          .getCalls()[0]
          .args[0].message.should.equal(
            'Too many items, please limit the number of items by unselecting some categories or sub-categories.'
          );

        const { itemsByCategory } = wrapper.update().find(ChildComponent).props();
        itemsByCategory.should.eql({});
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=666&item_ids=')
          .should.have.length(1);
        fetchMock.calls('*').should.have.length(1);
        done();
      });
    });
  });

  it('should fetch items by tags', (done) => {
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2&item_ids=&tags=tag1,tag2',
      { count: 2 }
    );
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2&item_ids=&tags=tag1,tag2',
      [
        { itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] },
        { itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] },
      ]
    );
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} tags={['tag1', 'tag2']} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        itemsByCategory.should.eql({
          1: [{ itemID: '1', description: 'Item 1', categoryID: '1', itemMatrixID: '0', Prices: [] }],
          2: [{ itemID: '2', description: 'Item 2', categoryID: '2', itemMatrixID: '0', Prices: [] }],
        });
        fetchMock
          .calls(
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key' +
              '&category_ids=1,2&item_ids=&tags=tag1,tag2'
          )
          .should.have.length(1);
        fetchMock
          .calls(
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key' +
              '&category_ids=1,2&item_ids=&tags=tag1,tag2'
          )
          .should.have.length(1);
        done();
      });
    });
  });

  it('should handle empty tags [] without fetching data', (done) => {
    const wrapper = mount(<TestComponent authkey='auth-key' categoryIds={['1', '2']} tags={[]} />);

    const child = wrapper.find(ChildComponent);
    child.prop('fetchingState').should.equal(FETCHING_STATES.FETCHING);
    child.prop('itemsByCategory').should.eql({});

    setImmediate(() => {
      setImmediate(() => {
        const { itemsByCategory, fetchingState } = wrapper.update().find(ChildComponent).props();
        fetchingState.should.equal(FETCHING_STATES.OK);
        itemsByCategory.should.eql({ 1: [], 2: [] });
        fetchMock.calls('*').should.have.length(0);
        done();
      });
    });
  });
});
