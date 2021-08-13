import './setupTest';
import getProperties from './getProperties';

const toPlainObject = (obj) => JSON.parse(JSON.stringify(obj));

describe('getProperties', () => {
  it('should return enough controls', () => {
    const properties = toPlainObject(getProperties({ presentation: { values: {} } }));

    properties.should.have.properties(['authKey', 'duration']);
  });

  describe('authKey', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.authKey.should.eql({
        label: 'Connect to Lightspeed',
        type: 'oAuth',
        optional: false,
        constraints: {},
        authUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/auth',
        verifyUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/verify',
        verifyQsParam: 'auth_key',
        logoutUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/logout',
        logoutQsParam: 'auth_key',
      });
    });
  });

  describe('locationId', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.locationId.should.eql({
        label: 'select a business location',
        type: 'selection',
        optional: true,
        constraints: {},
        options: [],
        optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/locationOptions?auth_key={{authKey}}',
        hide: true,
      });
    });

    it('should be shown after ls is connected', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: { authKey: 'auth-key' } } }));
      properties.locationId.hide.should.be.false();
    });
  });

  describe('dynamic props', () => {
    it('should add dynamic props if connected and a location is selected', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.should.not.have.properties(['category-ids']);

      const values = {
        authKey: 'auth-key',
        locationId: 'location-id',
        categoryIds: ['1', '2'],
        'category-2-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
        'category-2-item-ids': ['item-1'],
        'category-2-subcategory-ids': ['3', '4'],
        'category-3-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
      };
      const builderState = {
        inputs: [
          {
            path: ['categoryIds'],
            state: { selectedOption: { label: 'Category 2', value: '2' } },
          },
          {
            path: ['category-2-subcategory-ids'],
            state: { selectedOption: { label: 'Category 3', value: '3' } },
          },
          {
            path: ['category-2-item-ids'],
            state: { selectedOption: { label: 'Item 2', value: 'item-2' } },
          },
        ],
      };
      toPlainObject(getProperties({ presentation: { values }, builderState })).should.containEql({
        categoryIds: {
          label: 'select categories',
          type: 'selection',
          optional: true,
          multiple: true,
          searchable: true,
          selectable: true,
          sortable: [
            { label: 'Default', by: 'default' },
            { label: 'Name', by: 'label' },
          ],
          constraints: {},
          options: [],
          optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categoryOptions?auth_key={{authKey}}&parent_id=0',
        },
        'category-2-details': {
          label: 'select Category 2 details',
          type: 'selection',
          optional: true,
          multiple: true,
          constraints: {},
          options: [],
          optionsUrl:
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/category/2/detailOptions?auth_key={{authKey}}&hide_price=false',
          disable: false,
        },
        'category-2-subcategory-ids': {
          label: 'select Category 2 sub-categories',
          type: 'selection',
          optional: true,
          multiple: true,
          searchable: true,
          selectable: true,
          sortable: [
            { label: 'Default', by: 'default' },
            { label: 'Name', by: 'label' },
          ],
          constraints: {},
          options: [],
          optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categoryOptions?auth_key={{authKey}}&parent_id=2',
        },
        'category-3-details': {
          label: 'select Category 3 details',
          type: 'selection',
          optional: true,
          multiple: true,
          constraints: {},
          options: [],
          optionsUrl:
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/category/3/detailOptions?auth_key={{authKey}}&hide_price=false',
          disable: false,
        },
        'category-3-subcategory-ids': {
          label: 'select Category 3 sub-categories',
          type: 'selection',
          optional: true,
          multiple: true,
          searchable: true,
          selectable: true,
          sortable: [
            { label: 'Default', by: 'default' },
            { label: 'Name', by: 'label' },
          ],
          constraints: {},
          options: [],
          optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categoryOptions?auth_key={{authKey}}&parent_id=3',
        },
        'category-3-item-ids': {
          label: 'select Category 3 items',
          type: 'selection',
          optional: true,
          multiple: true,
          searchable: true,
          selectable: true,
          sortable: [
            { label: 'Default', by: 'default' },
            { label: 'Name', by: 'label' },
          ],
          constraints: {},
          options: [],
          optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemOptions?auth_key={{authKey}}&category_id=3',
        },
        'category-2-item-ids': {
          label: 'select Category 2 items',
          type: 'selection',
          optional: true,
          multiple: true,
          searchable: true,
          selectable: true,
          sortable: [
            { label: 'Default', by: 'default' },
            { label: 'Name', by: 'label' },
          ],
          constraints: {},
          options: [],
          optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/itemOptions?auth_key={{authKey}}&category_id=2',
        },
        'item-item-2-details': {
          label: 'select Item 2 details',
          type: 'selection',
          optional: true,
          multiple: true,
          constraints: {},
          options: [],
          optionsUrl:
            'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/item/item-2/detailOptions?' +
            'auth_key={{authKey}}&hide_price=false&location_id={{locationId}}',
          disable: true,
        },
      });
    });

    it('should have menu layout properties', () => {
      const properties = toPlainObject(
        getProperties({ presentation: { values: { authKey: 'auth-key', locationId: 'location-id' } } })
      );

      properties.should.have.properties([
        'qrActive',
        'qrSource',
        'qrUrlContent',
        'qrImage',
        'qrSize',
        'qrCallToAction',
        'shouldFormatPrice',
        'currency',
        'priceFormat',
        'layout',
        'image',
        'enableAnimation',
        'footnote',
        'footnoteSize',
        'theme',
      ]);
    });
  });

  describe('shouldFilterByTags', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(
        getProperties({ presentation: { values: { authKey: 'auth-key', locationId: 'location-id' } } })
      );
      properties.shouldFilterByTags.should.eql({
        label: 'filter by tags',
        type: 'boolean',
        constraints: {},
        optional: true,
        default: false,
      });
    });

    it('should not shown if not connected', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.should.not.have.property('shouldFilterByTags');
    });
  });

  describe('tags', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(
        getProperties({ presentation: { values: { authKey: 'auth-key', locationId: 'location-id' } } })
      );
      properties.tags.should.eql({
        label: 'tags',
        type: 'selection',
        optional: true,
        multiple: true,
        searchable: true,
        constraints: {},
        options: [],
        optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/tagOptions?auth_key={{authKey}}',
        hide: true,
      });
    });

    it('should not shown if not connected', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.should.not.have.property('tags');
    });

    it('should shown if shouldFilterByTags is true', () => {
      const properties = toPlainObject(
        getProperties({
          presentation: { values: { authKey: 'auth-key', locationId: 'location-id', shouldFilterByTags: true } },
        })
      );
      properties.tags.hide.should.be.false();
    });
  });

  describe('outOfStockAction', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(
        getProperties({ presentation: { values: { authKey: 'auth-key', locationId: 'location-id' } } })
      );
      properties.outOfStockAction.should.eql({
        label: 'out of stock items',
        type: 'toggleButtonGroup',
        optional: true,
        constraints: {},
        options: [
          { label: 'Leave it', value: 'LEAVE_IT' },
          { label: 'Remove', value: 'REMOVE' },
          { label: 'Strikethrough', value: 'STRIKETHROUGH' },
        ],
        default: 'LEAVE_IT',
        exclusive: true,
      });
    });
  });

  describe('duration', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.duration.should.eql({
        label: 'duration',
        type: 'number',
        optional: true,
        constraints: { min: 5 },
        default: 120,
        helperText: 'time in seconds.',
      });
    });
  });
});
