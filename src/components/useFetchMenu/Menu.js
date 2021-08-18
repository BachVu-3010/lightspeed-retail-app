import groupBy from 'lodash.groupby';
import memoize from 'lodash.memoize';

import { DEFAULT_CATEGORY_DETAILS, DEFAULT_ITEM_DETAILS, DETAIL_OPTIONS, OUT_OF_STOCK_OPTIONS } from '../../constants';
import {
  CategorySelection,
  CategoryDetailSelection,
  ItemSelection,
  ItemDetailSelection,
  ModifierSelection,
} from '../../utils/selections';

const flatMap = (arr, func) => [].concat.apply([], arr.map(func));
const isEmpty = (arr) => !arr || !arr.length;

export const itemPricing = memoize(
  (price) => (priceFormatter) => {
    const priceNumber = parseFloat(String(price));
    return priceFormatter(priceNumber || '');
  },
  (...args) => args.join('__')
);

class Item {
  constructor(item) {
    this.id = item.itemID;
    this.item = item;

    this.detailSelection = new ItemDetailSelection({ id: this.id });
    this.modifierSelection = new ModifierSelection({ id: this.id });
  }

  getDetails(values) {
    return this.detailSelection.getSelectedIds(values) || DEFAULT_ITEM_DETAILS;
  }

  getSelectedVariants(values) {
    const variants = this.item.variants || [];
    if (!variants) return variants;

    const selectedDetails = this.getDetails(values);
    if (!selectedDetails.includes(DETAIL_OPTIONS.MODIFIERS)) return [];

    const selectedModifierIds = this.modifierSelection.getSelectedIds(values);
    if (selectedModifierIds === undefined) return variants;

    return variants.filter((variant) => selectedModifierIds.includes(variant.itemID));
  }

  getPricing(location) {
    const prices = this.item.prices || [];
    const foundPrice = prices.find((price) => price.useTypeID === location.priceLevelID) || prices[0];
    if (foundPrice && foundPrice.amount) {
      return itemPricing(foundPrice.amount);
    }
    return undefined;
  }

  isOutOfStockAt(location) {
    const itemShop = (this.item.itemShops || []).find((itemShop) => itemShop.shopID === location.shopID);
    if (!itemShop) return false;

    const stockCount = parseFloat(String(itemShop.qoh));
    return stockCount <= 0;
  }

  build(values, location, hidePrice = false) {
    const details = this.getDetails(values);
    if (details.length === 0) return undefined;

    const formattedItem = { id: this.id };

    // apply out of stock action
    const { outOfStockAction = OUT_OF_STOCK_OPTIONS.DEFAULT } = values;
    if (this.isOutOfStockAt(location)) {
      if (outOfStockAction === OUT_OF_STOCK_OPTIONS.REMOVE) return undefined;
      if (outOfStockAction === OUT_OF_STOCK_OPTIONS.STRIKETHROUGH) {
        formattedItem.strikethrough = true;
      }
    }

    if (details.includes(DETAIL_OPTIONS.NAME)) {
      formattedItem.name = this.item.description; // in LS Retail, item's decription is item's name
    }

    const shouldHidePrice = hidePrice || !details.includes(DETAIL_OPTIONS.PRICE);
    if (!shouldHidePrice) {
      formattedItem.pricing = this.getPricing(location);
    }

    const variants = this.getSelectedVariants(values);
    if (details.includes(DETAIL_OPTIONS.MODIFIERS)) {
      formattedItem.variants = variants
        .map((v) => new Item(v).build(values, location, shouldHidePrice))
        .filter((item) => item);
    }

    // filter by tags
    const { shouldFilterByTags, tags } = values;
    const itemTags = this.item.tags || [];
    if (shouldFilterByTags && tags && isEmpty(formattedItem.variants)) {
      const tagMatched = itemTags.length && itemTags.some((tag) => tags.includes(tag));
      if (!tagMatched) return undefined;
    }

    // remove matrix if its vairants is all filtered by stock count or tags
    if (!isEmpty(variants) && isEmpty(formattedItem.variants)) {
      return undefined;
    }

    // if all variant is striked through, strikethrough the matrix too
    if (!isEmpty(formattedItem.variants) && formattedItem.variants.every((v) => v.strikethrough)) {
      formattedItem.strikethrough = true;
    }

    if (isEmpty(formattedItem.variants)) delete formattedItem.variants;

    return formattedItem;
  }
}

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

      category.items = items
        .map((item) => new Item(item).build(values, location, hideChildPrice))
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
