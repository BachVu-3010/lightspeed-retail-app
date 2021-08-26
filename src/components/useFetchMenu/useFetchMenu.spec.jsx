import React from 'react';
import { mount } from 'enzyme';
import fetchMock from 'fetch-mock';

import { setupRetryingRequestWithoutDelay } from '../../setupTest';
import { itemPricing } from './Menu';
import useFetchMenu from './';
import { OUT_OF_STOCK_OPTIONS } from '../../constants';

const createPrices = (price) => [
  { amount: '1', useTypeID: '1', useType: 'Default' },
  { amount: String(price), useTypeID: '2', useType: 'MSRP' },
];

const createItemShops = (itemId, stockCount) => [
  { itemID: itemId, shopID: '0', qoh: '8', sellable: '7' },
  { itemID: itemId, shopID: '1', qoh: String(stockCount), sellable: String(stockCount - 1) },
];

describe('useFetchMenu', () => {
  setupRetryingRequestWithoutDelay();

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
      {
        itemID: '1',
        description: 'Item 1',
        categoryID: '1',
        prices: createPrices(1),
        itemShops: createItemShops('1', 1),
      },
      {
        itemID: '2',
        description: 'Item 2',
        categoryID: '1',
        prices: createPrices(2),
        itemShops: createItemShops('1', 0),
        tags: ['tag1', 'tag2', 'tag3'],
      },
      {
        itemID: '3',
        description: 'Item 3',
        categoryID: '3',
        prices: createPrices(3),
        itemShops: createItemShops('1', 12),
        tags: ['tag4'],
      },
      {
        itemID: '4',
        description: 'Item 4',
        categoryID: '3',
        prices: createPrices(4),
        itemShops: createItemShops('1', 0),
        tags: ['tag3'],
      },
      {
        itemID: '5',
        description: 'Item 5',
        categoryID: '5',
        prices: createPrices(5),
        itemShops: createItemShops('1', 13),
        tags: ['tag5'],
      },
    ]);
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
      { count: 5 }
    );
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
      []
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  const ChildComponent = () => <div />;
  const TestComponent = ({ values }) => {
    const [renderingCategories, loading, hasError] = useFetchMenu(values);
    return <ChildComponent renderingCategories={renderingCategories} loading={loading} hasError={hasError} />;
  };

  it('should fetch location, categories and items to build the menu data', (done) => {
    const wrapper = mount(<TestComponent values={{ authKey: 'auth-key', locationId: '1', categoryIds: ['1', '2'] }} />);

    const child = wrapper.find(ChildComponent);
    child.prop('loading').should.be.true();
    child.prop('hasError').should.be.false();
    child.prop('renderingCategories').should.eql([]);

    setImmediate(() => {
      setImmediate(() => {
        const updatedChild = wrapper.update().find(ChildComponent);
        updatedChild.prop('loading').should.be.false();
        updatedChild.prop('hasError').should.be.false();
        updatedChild.prop('renderingCategories').should.eql([
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

  it('should strikethrough out of stock items if the action is strikethrough', (done) => {
    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          outOfStockAction: OUT_OF_STOCK_OPTIONS.STRIKETHROUGH,
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('loading').should.be.false();
      updatedChild.prop('hasError').should.be.false();
      updatedChild.prop('renderingCategories').should.eql([
        {
          id: '1',
          name: 'Category 1',
          items: [
            { id: '1', name: 'Item 1', pricing: itemPricing('1') },
            { id: '2', name: 'Item 2', pricing: itemPricing('2'), strikethrough: true },
          ],
          subgroups: [
            {
              id: '3',
              name: 'Category 1.1',
              items: [
                { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                { id: '4', name: 'Item 4', pricing: itemPricing('4'), strikethrough: true },
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

      done();
    });
  });

  it('should remove out of stock items if the action is remove', (done) => {
    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          outOfStockAction: OUT_OF_STOCK_OPTIONS.REMOVE,
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('loading').should.be.false();
      updatedChild.prop('hasError').should.be.false();
      updatedChild.prop('renderingCategories').should.eql([
        {
          id: '1',
          name: 'Category 1',
          items: [{ id: '1', name: 'Item 1', pricing: itemPricing('1') }],
          subgroups: [
            {
              id: '3',
              name: 'Category 1.1',
              items: [{ id: '3', name: 'Item 3', pricing: itemPricing('3') }],
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

      done();
    });
  });

  it('should be able to filter items by tags', (done) => {
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4',
      [
        {
          itemID: '2',
          description: 'Item 2',
          categoryID: '1',
          prices: createPrices(2),
          itemShops: createItemShops('1', 0),
          tags: ['tag1', 'tag2', 'tag3'],
        },
        {
          itemID: '3',
          description: 'Item 3',
          categoryID: '3',
          prices: createPrices(3),
          itemShops: createItemShops('1', 12),
          tags: ['tag4'],
        },
        {
          itemID: '4',
          description: 'Item 4',
          categoryID: '3',
          prices: createPrices(4),
          itemShops: createItemShops('1', 0),
          tags: ['tag3'],
        },
      ]
    );
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4',
      { count: 3 }
    );

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          shouldFilterByTags: false,
          tags: ['tag3', 'tag4'],
        }}
      />
    );

    const noFilteredCategories = [
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
          { id: '4', name: 'Category 1.2', items: [], subgroups: [] },
        ],
      },
      { id: '2', name: 'Category 2', items: [], subgroups: [] },
    ];

    setImmediate(() => {
      wrapper.update().find(ChildComponent).prop('renderingCategories').should.eql(noFilteredCategories);

      wrapper.setProps({
        values: {
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          shouldFilterByTags: true,
          tags: undefined,
        },
      });

      setImmediate(() => {
        wrapper.update().find(ChildComponent).prop('renderingCategories').should.eql(noFilteredCategories);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
          .should.have.length(1);

        setImmediate(() => {
          wrapper.setProps({
            values: {
              authKey: 'auth-key',
              locationId: '1',
              categoryIds: ['1', '2'],
              shouldFilterByTags: true,
              tags: ['tag3', 'tag4'],
            },
          });

          setImmediate(() => {
            wrapper
              .update()
              .find(ChildComponent)
              .prop('renderingCategories')
              .should.eql([
                {
                  id: '1',
                  name: 'Category 1',
                  items: [{ id: '2', name: 'Item 2', pricing: itemPricing('2') }],
                  subgroups: [
                    {
                      id: '3',
                      name: 'Category 1.1',
                      items: [
                        { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                        { id: '4', name: 'Item 4', pricing: itemPricing('4') },
                      ],
                      subgroups: [{ id: '5', name: 'Category 1.1.1', items: [], subgroups: [] }],
                    },
                    { id: '4', name: 'Category 1.2', items: [], subgroups: [] },
                  ],
                },
                { id: '2', name: 'Category 2', items: [], subgroups: [] },
              ]);

            fetchMock
              .calls(
                'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key' +
                  '&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4'
              )
              .should.have.length(1);
            fetchMock
              .calls(
                'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key' +
                  '&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4'
              )
              .should.have.length(1);
            done();
          });
        });
      });
    });
  });

  it('should be able to hide price', (done) => {
    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-5-details': ['name_detail', 'item_detail', 'subcategory_detail'],
          'item-2-details': ['name_detail'],
          'item-3-details': ['name_detail'],
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('renderingCategories').should.eql([
        {
          id: '1',
          name: 'Category 1',
          items: [
            { id: '1', name: 'Item 1', pricing: itemPricing('1') },
            { id: '2', name: 'Item 2' },
          ],
          subgroups: [
            {
              id: '3',
              name: 'Category 1.1',
              items: [
                { id: '3', name: 'Item 3' },
                { id: '4', name: 'Item 4', pricing: itemPricing('4') },
              ],
              subgroups: [
                {
                  id: '5',
                  name: 'Category 1.1.1',
                  items: [{ id: '5', name: 'Item 5' }],
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

  it('should be able to hide names', (done) => {
    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-5-details': ['item_detail', 'subcategory_detail', 'pricing_detail'],
          'item-2-details': ['price_detail'],
          'item-3-details': ['price_detail'],
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('renderingCategories').should.eql([
        {
          id: '1',
          name: 'Category 1',
          items: [
            { id: '1', name: 'Item 1', pricing: itemPricing('1') },
            { id: '2', pricing: itemPricing('2') },
          ],
          subgroups: [
            {
              id: '3',
              name: 'Category 1.1',
              items: [
                { id: '3', pricing: itemPricing('3') },
                { id: '4', name: 'Item 4', pricing: itemPricing('4') },
              ],
              subgroups: [
                {
                  id: '5',
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

  it('should be able to hide sub categories', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1', prices: createPrices(1) },
      { itemID: '2', description: 'Item 2', categoryID: '1', prices: createPrices(2) },
      { itemID: '3', description: 'Item 3', categoryID: '3', prices: createPrices(3) },
      { itemID: '4', description: 'Item 4', categoryID: '3', prices: createPrices(4) },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4&item_ids=', {
      count: 4,
    });
    fetchMock.mock(
      'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4&item_ids=',
      []
    );

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-3-details': ['name_detail', 'item_detail', 'pricing_detail'],
          'item-2-details': ['name_detail', 'price_detail'],
          'item-3-details': ['name_detail', 'price_detail'],
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('renderingCategories').should.eql([
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
      done();
      fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
      fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4&item_ids=')
        .should.have.length(1);
    });
  });

  it('should be able to hide items', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,4&item_ids=', [
      {
        itemID: '1',
        description: 'Item 1',
        categoryID: '1',
        prices: createPrices(1),
        itemShops: createItemShops('1', 1),
      },
      {
        itemID: '2',
        description: 'Item 2',
        categoryID: '1',
        prices: createPrices(2),
        itemShops: createItemShops('1', 0),
        tags: ['tag1', 'tag2', 'tag3'],
      },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,4&item_ids=', {
      count: 2,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,4&item_ids=', []);

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-3-details': ['name_detail', 'subcategory_detail', 'pricing_detail'],
          'category-5-details': ['name_detail', 'subcategory_detail', 'pricing_detail'],
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('renderingCategories').should.eql([
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
              subgroups: [
                {
                  id: '5',
                  name: 'Category 1.1.1',
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
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,4&item_ids=')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,4&item_ids=')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,4&item_ids=')
        .should.have.length(1);
      done();
    });
  });

  it('should be able to deselect some items', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=2,4&item_ids=2,3', [
      {
        itemID: '2',
        description: 'Item 2',
        categoryID: '1',
        prices: createPrices(2),
        itemShops: createItemShops('1', 0),
        tags: ['tag1', 'tag2', 'tag3'],
      },
      {
        itemID: '3',
        description: 'Item 3',
        categoryID: '3',
        prices: createPrices(3),
        itemShops: createItemShops('1', 12),
        tags: ['tag4'],
      },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=2,4&item_ids=2,3', {
      count: 2,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=2,4&item_ids=2,3', []);

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-1-item-ids': ['2'],
          'category-3-item-ids': ['3'],
          'category-5-item-ids': [],
        }}
      />
    );
    const child = wrapper.find(ChildComponent);
    child.prop('loading').should.be.true();
    child.prop('hasError').should.be.false();
    child.prop('renderingCategories').should.eql([]);

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('loading').should.be.false();
      updatedChild.prop('hasError').should.be.false();
      updatedChild.prop('renderingCategories').should.eql([
        {
          id: '1',
          name: 'Category 1',
          items: [{ id: '2', name: 'Item 2', pricing: itemPricing('2') }],
          subgroups: [
            {
              id: '3',
              name: 'Category 1.1',
              items: [{ id: '3', name: 'Item 3', pricing: itemPricing('3') }],
              subgroups: [
                {
                  id: '5',
                  name: 'Category 1.1.1',
                  items: [],
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
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=2,4&item_ids=2,3')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=2,4&item_ids=2,3')
        .should.have.length(1);
      done();
    });
  });

  it('should be able to deselect some categories', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,3&item_ids=', [
      { itemID: '1', description: 'Item 1', categoryID: '1', prices: createPrices(1) },
      { itemID: '2', description: 'Item 2', categoryID: '1', prices: createPrices(2) },
      { itemID: '3', description: 'Item 3', categoryID: '3', prices: createPrices(3) },
      { itemID: '4', description: 'Item 4', categoryID: '3', prices: createPrices(4) },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,3&item_ids=', {
      count: 4,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,3&item_ids=', []);

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1'],
          'category-1-subcategory-ids': ['3'],
          'category-3-subcategory-ids': [],
        }}
      />
    );

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('loading').should.be.false();
      updatedChild.prop('hasError').should.be.false();
      updatedChild.prop('renderingCategories').should.eql([
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
              subgroups: [],
            },
          ],
        },
      ]);

      fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
      fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,3&item_ids=')
        .should.have.length(1);
      fetchMock
        .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,3&item_ids=')
        .should.have.length(1);
      done();
    });
  });

  it('should return empty if failed to fetch data', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=invalid-auth-key', 403);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=invalid-auth-key', 403);
    const wrapper = mount(
      <TestComponent values={{ authKey: 'invalid-auth-key', locationId: '1', categoryIds: ['1', '2'] }} />
    );

    const child = wrapper.find(ChildComponent);
    child.prop('loading').should.be.true();
    child.prop('hasError').should.be.false();
    child.prop('renderingCategories').should.eql([]);

    setImmediate(() => {
      const updatedChild = wrapper.update().find(ChildComponent);
      updatedChild.prop('loading').should.be.false();
      updatedChild.prop('hasError').should.be.true();
      updatedChild.prop('renderingCategories').should.eql([]);

      fetchMock.calls('begin:/TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location').should.have.length(1);
      fetchMock.calls('begin:/TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories').should.have.length(1);
      fetchMock.calls('begin:/TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items').should.have.length(0);
      done();
    });
  });

  it('should fetch enough items', (done) => {
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=5&item_ids=1,3,4', [
      {
        itemID: '1',
        description: 'Item 1',
        categoryID: '1',
        prices: createPrices(1),
        itemShops: createItemShops('1', 1),
      },
      {
        itemID: '3',
        description: 'Item 3',
        categoryID: '3',
        prices: createPrices(3),
        itemShops: createItemShops('1', 12),
        tags: ['tag4'],
      },
      {
        itemID: '4',
        description: 'Item 4',
        categoryID: '3',
        prices: createPrices(4),
        itemShops: createItemShops('1', 0),
        tags: ['tag3'],
      },
      {
        itemID: '5',
        description: 'Item 5',
        categoryID: '5',
        prices: createPrices(5),
        itemShops: createItemShops('1', 13),
        tags: ['tag5'],
      },
    ]);
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=5&item_ids=1,3,4', {
      count: 5,
    });
    fetchMock.mock('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=5&item_ids=1,3,4', []);

    const wrapper = mount(
      <TestComponent
        values={{
          authKey: 'auth-key',
          locationId: '1',
          categoryIds: ['1', '2'],
          'category-1-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
          'category-1-item-ids': ['1'],
          'category-1-subcategory-ids': ['3'],
          'category-3-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
          'category-3-item-ids': ['3', '4'],
          'category-3-subcategory-ids': ['5'],
          'category-5-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
          'category-2-details': ['name_detail'],
        }}
      />
    );

    setImmediate(() => {
      setImmediate(() => {
        const updatedChild = wrapper.update().find(ChildComponent);
        updatedChild.prop('loading').should.be.false();
        updatedChild.prop('hasError').should.be.false();
        updatedChild.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [{ id: '1', name: 'Item 1', pricing: itemPricing('1') }],
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
            ],
          },
          { id: '2', name: 'Category 2' },
        ]);

        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=5&item_ids=1,3,4')
          .should.have.length(1);
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=5&item_ids=1,3,4')
          .should.have.length(1);
        done();
      });
    });
  });

  describe('matrix', () => {
    beforeEach(() => {
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
        [
          {
            itemID: '1',
            description: 'Item 1',
            categoryID: '1',
            itemMatrixID: '0',
            prices: createPrices(1),
            itemShops: createItemShops('1', 1),
          },
          {
            itemID: '2',
            description: 'T-shirt Size S',
            categoryID: '1',
            itemMatrixID: '1',
            prices: createPrices(2),
            itemShops: createItemShops('1', 0),
            tags: ['tag1', 'tag2'],
          },
          {
            itemID: '3',
            description: 'Item 3',
            categoryID: '3',
            prices: createPrices(3),
            itemShops: createItemShops('1', 12),
            tags: ['tag4'],
          },
          {
            itemID: '4',
            description: 'T-shirt Size S Color Blue',
            categoryID: '1',
            itemMatrixID: '1',
            prices: createPrices(3),
            itemShops: createItemShops('1', 10),
            tags: ['tag4'],
          },
          {
            itemID: '5',
            description: 'T-shirt 2 Size M',
            categoryID: '3',
            itemMatrixID: '2',
            prices: createPrices(2),
            itemShops: createItemShops('1', 0),
            tags: ['tag1'],
          },
          {
            itemID: '6',
            description: 'T-shirt 2 Size L',
            categoryID: '3',
            itemMatrixID: '2',
            prices: createPrices(2),
            itemShops: createItemShops('1', 0),
            tags: ['tag2'],
          },
        ],
        { overwriteRoutes: true }
      );
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
        { count: 6 },
        { overwriteRoutes: true }
      );
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=',
        [
          { itemMatrixID: '1', description: 'T-shirt', categoryID: '1' },
          { itemMatrixID: '2', description: 'T-shirt 2', categoryID: '3' },
        ],
        { overwriteRoutes: true }
      );
    });

    it('should group matrix items into an item with modifiers', (done) => {
      const wrapper = mount(
        <TestComponent values={{ authKey: 'auth-key', locationId: '1', categoryIds: ['1', '2'] }} />
      );
      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('loading').should.be.false();
        child.prop('hasError').should.be.false();
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [
                  { id: '2', name: 'Size S', pricing: itemPricing('2') },
                  { id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') },
                ],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  {
                    id: 'matrix-2',
                    name: 'T-shirt 2',
                    pricing: undefined,
                    variants: [
                      { id: '5', name: 'Size M', pricing: itemPricing('2') },
                      { id: '6', name: 'Size L', pricing: itemPricing('2') },
                    ],
                  },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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

        // fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/location/1?auth_key=auth-key').should.have.length(1);
        // fetchMock.calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categories?auth_key=auth-key').should.have.length(1);
        // fetchMock
        //   .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
        //   .should.have.length(1);
        // fetchMock
        //   .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
        //   .should.have.length(1);
        // fetchMock
        //   .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
        //   .should.have.length(1);
        done();
      });
    });

    it('should able to hide modifier price', (done) => {
      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            'item-matrix-2-details': ['name_detail', 'modifier_detail'],
          }}
        />
      );
      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [
                  { id: '2', name: 'Size S', pricing: itemPricing('2') },
                  { id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') },
                ],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  {
                    id: 'matrix-2',
                    name: 'T-shirt 2',
                    variants: [
                      { id: '5', name: 'Size M' },
                      { id: '6', name: 'Size L' },
                    ],
                  },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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

        done();
      });
    });

    it('should filter out deselected modifiers', (done) => {
      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            'item-matrix-1-modifier-ids': [],
            'item-matrix-2-modifier-ids': ['6'],
          }}
        />
      );

      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('loading').should.be.false();
        child.prop('hasError').should.be.false();
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              { id: 'matrix-1', name: 'T-shirt', pricing: undefined },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  {
                    id: 'matrix-2',
                    name: 'T-shirt 2',
                    pricing: undefined,
                    variants: [{ id: '6', name: 'Size L', pricing: itemPricing('2') }],
                  },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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

        done();
      });
    });

    it('should filter out all modifiiers if the modifier detail option is delsected', (done) => {
      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            'item-matrix-2-details': ['name_detail', 'price_detail'],
          }}
        />
      );

      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [
                  { id: '2', name: 'Size S', pricing: itemPricing('2') },
                  { id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') },
                ],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  { id: 'matrix-2', name: 'T-shirt 2', pricing: undefined },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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

        done();
      });
    });

    it('should filter modifiers by tags', (done) => {
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4',
        [
          {
            itemID: '3',
            description: 'Item 3',
            categoryID: '3',
            prices: createPrices(3),
            itemShops: createItemShops('1', 12),
            tags: ['tag4'],
          },
          {
            itemID: '4',
            description: 'T-shirt Size S Color Blue',
            categoryID: '1',
            itemMatrixID: '1',
            prices: createPrices(3),
            itemShops: createItemShops('1', 10),
            tags: ['tag4'],
          },
        ],
        { overwriteRoutes: true }
      );
      fetchMock.mock(
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4',
        { count: 2 },
        { overwriteRoutes: true }
      );

      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            shouldFilterByTags: true,
            tags: ['tag3', 'tag4'],
          }}
        />
      );
      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('loading').should.be.false();
        child.prop('hasError').should.be.false();
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [{ id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') }],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [{ id: '3', name: 'Item 3', pricing: itemPricing('3') }],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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
          .calls(
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/items?auth_key=auth-key' +
              '&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4'
          )
          .should.have.length(1);
        fetchMock
          .calls(
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemsCount?auth_key=auth-key' +
              '&category_ids=1,2,3,4,5&item_ids=&tags=tag3,tag4'
          )
          .should.have.length(1);
        done();
      });
    });

    it('should be able to apply strikethrough action on out of stock modifiers', (done) => {
      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            outOfStockAction: OUT_OF_STOCK_OPTIONS.STRIKETHROUGH,
          }}
        />
      );

      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('loading').should.be.false();
        child.prop('hasError').should.be.false();
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [
                  { id: '2', name: 'Size S', pricing: itemPricing('2'), strikethrough: true },
                  { id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') },
                ],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [
                  { id: '3', name: 'Item 3', pricing: itemPricing('3') },
                  {
                    id: 'matrix-2',
                    name: 'T-shirt 2',
                    pricing: undefined,
                    strikethrough: true,
                    variants: [
                      { id: '5', name: 'Size M', pricing: itemPricing('2'), strikethrough: true },
                      { id: '6', name: 'Size L', pricing: itemPricing('2'), strikethrough: true },
                    ],
                  },
                ],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
          .should.have.length(1);
        done();
      });
    });

    it('should be able to apply remove action on out of stock modifiers', (done) => {
      const wrapper = mount(
        <TestComponent
          values={{
            authKey: 'auth-key',
            locationId: '1',
            categoryIds: ['1', '2'],
            outOfStockAction: OUT_OF_STOCK_OPTIONS.REMOVE,
          }}
        />
      );

      setImmediate(() => {
        const child = wrapper.update().find(ChildComponent);
        child.prop('loading').should.be.false();
        child.prop('hasError').should.be.false();
        child.prop('renderingCategories').should.eql([
          {
            id: '1',
            name: 'Category 1',
            items: [
              { id: '1', name: 'Item 1', pricing: itemPricing('1') },
              {
                id: 'matrix-1',
                name: 'T-shirt',
                pricing: undefined,
                variants: [{ id: '4', name: 'Size S Color Blue', pricing: itemPricing('3') }],
              },
            ],
            subgroups: [
              {
                id: '3',
                name: 'Category 1.1',
                items: [{ id: '3', name: 'Item 3', pricing: itemPricing('3') }],
                subgroups: [
                  {
                    id: '5',
                    name: 'Category 1.1.1',
                    items: [],
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
        fetchMock
          .calls('TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/matrices?auth_key=auth-key&category_ids=1,2,3,4,5&item_ids=')
          .should.have.length(1);
        done();
      });
    });
  });
});
