import groupBy from 'lodash.groupby';
import memoize from 'lodash.memoize';

import { DEFAULT_CATEGORY_DETAILS, DEFAULT_ITEM_DETAILS, DETAIL_OPTIONS, OUT_OF_STOCK_OPTIONS } from '../../constants';
import { CategorySelection, CategoryDetailSelection, ItemSelection, ItemDetailSelection } from '../../utils/selections';

const flatMap = (arr, func) => [].concat.apply([], arr.map(func));

export const itemPricing = memoize(
  (price) => (priceFormatter) => {
    const priceNumber = parseFloat(String(price));
    return priceFormatter(priceNumber || '');
  },
  (...args) => args.join('__')
);

const buildItem = (values, item, location, hidePrice) => {
  const itemsDetailSelection = new ItemDetailSelection({ id: item.itemID });
  const details = itemsDetailSelection.getSelectedIds(values) || DEFAULT_ITEM_DETAILS;
  if (details.length === 0) return undefined;

  const formattedItem = { id: item.itemID };
  if (details.includes(DETAIL_OPTIONS.NAME)) {
    formattedItem.name = item.description; // in LS Retail, item's decription is item's name
  }

  if (!hidePrice && details.includes(DETAIL_OPTIONS.PRICE)) {
    const prices = item.prices || [];
    const foundPrice = prices.find((price) => price.useTypeID === location.priceLevelID) || prices[0];
    if (foundPrice && foundPrice.amount) {
      formattedItem.pricing = itemPricing(foundPrice.amount);
    }
  }
  const itemShop = (item.itemShops || []).find((itemShop) => itemShop.shopID === location.shopID);
  if (itemShop) {
    const stockCount = parseFloat(String(itemShop.qoh));
    if (stockCount <= 0) {
      const { outOfStockAction = OUT_OF_STOCK_OPTIONS.DEFAULT } = values;
      if (outOfStockAction === OUT_OF_STOCK_OPTIONS.REMOVE) return undefined;
      if (outOfStockAction === OUT_OF_STOCK_OPTIONS.STRIKETHROUGH) {
        formattedItem.strikethrough = true;
      }
    }
  }

  return formattedItem;
};

class CategoryNode {
  constructor(category, categoriesByParentId) {
    this.id = category.categoryID;
    this.category = category;

    this.detailSelection = new CategoryDetailSelection({ id: this.id });
    this.subcategorySelection = new CategorySelection({ id: this.id });
    this.itemSelection = new ItemSelection({ id: this.id });

    this.subcategories = (categoriesByParentId[this.id] || []).map(
      (category) => new CategoryNode(category, categoriesByParentId)
    );
  }

  getDetails(values) {
    return this.detailSelection.getSelectedIds(values) || DEFAULT_CATEGORY_DETAILS;
  }

  getSubCategories(values) {
    const selectedDetails = this.getDetails(values);
    if (!selectedDetails.includes(DETAIL_OPTIONS.SUBCATEGORIES)) return [];

    const selectedSubcategoryIds = this.subcategorySelection.getSelectedIds(values);
    if (selectedSubcategoryIds === undefined) return this.subcategories;

    return this.subcategories.filter((categoryNode) => selectedSubcategoryIds.includes(categoryNode.id));
  }

  getActiveCategoryIds(values) {
    const selectedDetails = this.getDetails(values);
    if (!selectedDetails.includes(DETAIL_OPTIONS.SUBCATEGORIES)) return [this.id];

    return [
      this.id,
      ...flatMap(this.getSubCategories(values), (categoryNode) => categoryNode.getActiveCategoryIds(values)),
    ];
  }

  getSelectedItems(values, items) {
    const selectedDetails = this.getDetails(values);
    if (!selectedDetails.includes(DETAIL_OPTIONS.ITEMS)) return [];

    const selectedItemIds = this.itemSelection.getSelectedIds(values);
    if (selectedItemIds === undefined) return items;

    return items.filter((item) => selectedItemIds.includes(item.itemID));
  }

  build(values, itemsByCategory, location, hidePrice = false) {
    const selectedDetails = this.getDetails(values);
    if (selectedDetails.length === 0) return undefined;

    const category = { id: this.id };
    if (selectedDetails.includes(DETAIL_OPTIONS.NAME)) {
      category.name = this.category.name;
    }

    const hideChildPrice = hidePrice || !selectedDetails.includes(DETAIL_OPTIONS.PRICING);
    if (selectedDetails.includes(DETAIL_OPTIONS.ITEMS)) {
      const items = this.getSelectedItems(values, itemsByCategory[this.id] || []);

      const { shouldFilterByTags, tags } = values;
      const filteredItems =
        shouldFilterByTags && tags
          ? items.filter((item) => (item.tags || []).some((tag) => tags.includes(tag)))
          : items;

      category.items = filteredItems
        .map((item) => buildItem(values, item, location, hideChildPrice))
        .filter((item) => item);
    }

    if (selectedDetails.includes(DETAIL_OPTIONS.SUBCATEGORIES)) {
      category.subgroups = this.getSubCategories(values).map((category) =>
        category.build(values, itemsByCategory, location, hideChildPrice)
      );
    }
    return category;
  }
}

export default class Menu {
  constructor(categories) {
    const categoriesByParentId = groupBy(categories, 'parentID');
    const topLevelCategories = categoriesByParentId['0'] || [];

    this.categorySelection = new CategorySelection();
    this.categoryNodes = topLevelCategories.map((category) => new CategoryNode(category, categoriesByParentId));
  }

  getCategories(values) {
    const selectedCategoryIds = this.categorySelection.getSelectedIds(values) || [];
    return this.categoryNodes.filter((categoryNode) => selectedCategoryIds.includes(categoryNode.id));
  }

  getActiveCategoryIds(values) {
    return flatMap(this.getCategories(values), (categoryNode) => categoryNode.getActiveCategoryIds(values)).sort();
  }

  build(values, itemsByCategory, location) {
    if (!itemsByCategory || !location) {
      return [];
    }

    return this.getCategories(values).map((categoryNode) => categoryNode.build(values, itemsByCategory, location));
  }
}
