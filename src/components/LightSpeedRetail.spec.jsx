import React from 'react';
import should from 'should';
import { mount } from 'enzyme';
import { spy, useFakeTimers } from 'sinon';
import fetchMock from 'fetch-mock';
import { act } from 'react-dom/test-utils';
import MenuLayout from 'raydiant-menu';

import '../setupTest';
import { LightSpeedRetail } from './LightSpeedRetail';
import { itemPricing } from './useFetchMenu/Menu';
import Loading from './Loading';

const createPrices = (price) => [
  { amount: '1', useTypeID: '1', useType: 'Default' },
  { amount: String(price), useTypeID: '2', useType: 'MSRP' },
];

describe('LightSpeedRetail', () => {
  beforeEach(() => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key', {
      shopID: '1',
      name: 'Raydiant (Engineering)',
      timeZone: 'America/Los_Angeles',
      timeStamp: '2021-07-22T01:46:13+00:00',
      priceLevelID: '2',
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key', [
      { categoryID: '1', name: 'Category 1', parentID: '0' },
      { categoryID: '2', name: 'Category 2', parentID: '0' },
      { categoryID: '3', name: 'Category 1.1', parentID: '1' },
      { categoryID: '4', name: 'Category 1.2', parentID: '1' },
      { categoryID: '5', name: 'Category 1.1.1', parentID: '3' },
      { categoryID: '6', name: 'Category 6', parentID: '0' },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1', prices: createPrices(1) },
      { itemID: '2', description: 'Item 2', categoryID: '1', prices: createPrices(2) },
      { itemID: '3', description: 'Item 3', categoryID: '3', prices: createPrices(3) },
      { itemID: '4', description: 'Item 4', categoryID: '3', prices: createPrices(4) },
      { itemID: '5', description: 'Item 5', categoryID: '5', prices: createPrices(5) },
    ]);
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
      5
    );
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
      []
    );

    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=invalid-auth-key', 403);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=invalid-auth-key', 403);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should render MenuLayout with correct props', (done) => {
    const onReady = spy();
    const onError = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        }}
        isPlaying={false}
        isThumbnail={false}
        onReady={onReady}
        onError={onError}
      />
    );

    setImmediate(() => {
      setImmediate(() => {
        const menuLayout = wrapper.update().find(MenuLayout);
        menuLayout.prop('presentation').should.eql({
          values: {
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        });
        menuLayout.prop('onError').should.equal(onError);
        menuLayout.prop('onReady').should.equal(onReady);
        menuLayout.prop('isPlaying').should.be.false();
        menuLayout.prop('isThumbnail').should.be.false();
        menuLayout.prop('categories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              { id: '2', name: 'Item 2', pricing: itemPricing('2') },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  { id: '4', name: 'Item 4', pricing: itemPricing('4') },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [{ id: '5', name: 'Item 5', pricing: itemPricing('5') }],
                    subgroups: [],
                  },
                ],
              },
              {
                id: '4',
                name: 'Category 1.2',
                items: [],
                subgroups: [],
              },
            ],
          },
          { id: '2', name: 'Category 2', items: [], subgroups: [] },
        ]);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
          .should.have.length(1);
        done();
      });
    });
  });

  it('should render loading screen on preview while fetching menu data', (done) => {
    const onReady = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        }}
        isDashboard
        isPlaying={false}
        isThumbnail={false}
        onReady={onReady}
        onError={spy()}
      />
    );

    wrapper.find(Loading).prop('title').should.equal('Loading...');
    onReady.should.be.calledOnce();

    setImmediate(() => {
      done();
    });
  });

  it('should raise error if not connected yet', (done) => {
    const onReady = spy();
    const onError = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: '',
            locationId: '1',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        }}
        isPlaying={false}
        isThumbnail={false}
        onReady={onReady}
        onError={onError}
      />
    );
    should(wrapper.html()).be.null();

    setImmediate(() => {
      onError.should.be.calledOnce();
      onError.getCalls()[0].args[0].message.should.equal('Please connect to LightSpeed');

      done();
    });
  });

  it('should raise error if no location found', (done) => {
    const onReady = spy();
    const onError = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: 'auth-key',
            locationId: 'none',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        }}
        isPlaying={false}
        isThumbnail={false}
        onReady={onReady}
        onError={onError}
      />
    );
    should(wrapper.html()).be.null();

    setImmediate(() => {
      onError.should.be.calledOnce();
      onError.getCalls()[0].args[0].message.should.equal('No location found');

      done();
    });
  });

  it('should raise error if failed to fetch inventory data', (done) => {
    const onReady = spy();
    const onError = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: 'invalid-auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            duration: 120,
          },
        }}
        isPlaying={false}
        isThumbnail={false}
        onReady={onReady}
        onError={onError}
      />
    );
    should(wrapper.html()).be.null();

    setImmediate(() => {
      onError.should.be.calledOnce();
      onError.getCalls()[0].args[0].message.should.equal('Failed to fetch inventory');

      done();
    });
  });

  it('should call onComplete after duration', (done) => {
    const realSetImmediate = setImmediate;
    const clock = useFakeTimers(new Date());
    const onReady = spy();
    const onComplete = spy();
    const wrapper = mount(
      <LightSpeedRetail
        presentation={{
          values: {
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: [],
            duration: 40,
          },
        }}
        isPlaying={false}
        onComplete={onComplete}
        onReady={onReady}
      />
    );

    realSetImmediate(() => {
      // Do not call onComplete when isPlaying is false
      clock.tick(40 * 1000 + 100);
      onComplete.should.not.be.called();

      // Call onComplete when isPlaying is true
      act(() => wrapper.setProps({ isPlaying: true }) && undefined);

      onComplete.should.not.be.called();
      clock.tick(40 * 1000 - 100);
      onComplete.should.not.be.called();
      clock.tick(200);
      onComplete.should.be.calledOnce();

      clock.restore();
      done();
    });
  });
});
