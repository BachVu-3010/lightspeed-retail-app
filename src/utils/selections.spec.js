import '../setupTest';
import { CategorySelection } from './selections';

const toPlainObject = (obj) => JSON.parse(JSON.stringify(obj));

describe('CategorySelection', () => {
  it('should have correct propId', () => {
    new CategorySelection().propId.should.equal('categoryIds');
    new CategorySelection({ id: 'parent-category-id', name: 'parent category name' }).propId.should.equal(
      'category-parent-category-id-subcategory-ids'
    );
  });

  it('should have correct prop', () => {
    toPlainObject(new CategorySelection().prop).should.eql({
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
    });
    toPlainObject(new CategorySelection({ id: 'parent-category-id', name: 'Parent category' }).prop).should.eql({
      label: 'select Parent category sub-categories',
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
      optionsUrl:
        'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/categoryOptions?auth_key={{authKey}}&parent_id=parent-category-id',
    });
  });

  it('should provide correct props via getProps', () => {
    const values = {
      categoryIds: ['1', '2'],
      'category-2-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
      'category-2-item-ids': ['1', 'matrix-1'],
      'item-matrix-1-details': ['name_detail', 'price_detail', 'modifier_detail'],
    };
    const builderState = {
      inputs: [
        {
          path: ['categoryIds'],
          state: { selectedOption: { label: 'Category 2', value: '2' } },
        },
        {
          path: ['category-2-item-ids'],
          state: { selectedOption: { label: 'T-shirt', value: 'matrix-1' } },
        },
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
      'item-matrix-1-details': {
        label: 'select T-shirt details',
        type: 'selection',
        optional: true,
        multiple: true,
        constraints: {},
        options: [],
        optionsUrl:
          'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/item/matrix-1/detailOptions?' +
          'auth_key={{authKey}}&hide_price=false&location_id={{locationId}}',
        disable: false,
      },
      'item-matrix-1-modifier-ids': {
        label: 'select T-shirt modifiers',
        type: 'selection',
        optional: true,
        multiple: true,
        constraints: {},
        options: [],
        optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/item/matrix-1/modifierOptions?auth_key={{authKey}}',
      },
    });
  });

  it('should disable the detail selection and hide other detail seelctions when the focused category is deselected', () => {
    const values = {
      categoryIds: ['1'],
      'category-2-details': ['name_detail', 'item_detail', 'subcategory_detail', 'pricing_detail'],
    };
    const builderState = {
      inputs: [
        {
          path: ['categoryIds'],
          state: { selectedOption: { label: 'Category 2', value: '2' } },
        },
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
        disable: true,
      },
    });
  });

  it('should hide the subcategory selection if subcategory detail option is deselected', () => {
    const values = {
      categoryIds: ['1', '2'],
      'category-2-details': ['name_detail', 'item_detail'],
    };
    const builderState = {
      inputs: [
        {
          path: ['categoryIds'],
          state: { selectedOption: { label: 'Category 2', value: '2' } },
        },
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
    });
  });

  it('should hide the item selection if item detail option is deselected', () => {
    const values = {
      categoryIds: ['1', '2'],
      'category-2-details': ['name_detail', 'subcategory_detail'],
    };
    const builderState = {
      inputs: [
        {
          path: ['categoryIds'],
          state: { selectedOption: { label: 'Category 2', value: '2' } },
        },
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
    });
  });

  it('should hide the sub-category detail pricing option if the parent pricing option is deselected', () => {
    const values = {
      categoryIds: ['1', '2'],
      'category-2-details': ['name_detail', 'subcategory_detail'],
      'category-2-subcategory-ids': ['3', '4'],
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
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
          'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/category/3/detailOptions?auth_key={{authKey}}&hide_price=true',
        disable: false,
      },
    });
  });

  it('should hide the item detail price option if the category pricing option is deselected', () => {
    const values = {
      categoryIds: ['1', '2'],
      'category-2-details': ['name_detail', 'item_detail'],
      'category-2-item-ids': ['3', '4'],
    };
    const builderState = {
      inputs: [
        {
          path: ['categoryIds'],
          state: { selectedOption: { label: 'Category 2', value: '2' } },
        },
        {
          path: ['category-2-item-ids'],
          state: { selectedOption: { label: 'Item 3', value: '3' } },
        },
      ],
    };
    toPlainObject(new CategorySelection().getProps(values, builderState)).should.eql({
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
      'item-3-details': {
        label: 'select Item 3 details',
        type: 'selection',
        optional: true,
        multiple: true,
        constraints: {},
        options: [],
        optionsUrl:
          'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/item/3/detailOptions?' +
          'auth_key={{authKey}}&hide_price=true&location_id={{locationId}}',
        disable: false,
      },
    });
  });
});
