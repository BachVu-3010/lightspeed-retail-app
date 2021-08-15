export const RAYDIANT_APP_LS_RETAIL_BASE_URL = process.env.RAYDIANT_APP_LS_RETAIL_BASE_URL;

export const DETAIL_OPTIONS = {
  NAME: 'name_detail',
  DESCRIPTION: 'description_detail',
  ITEMS: 'item_detail',
  SUBCATEGORIES: 'subcategory_detail',
  PRICING: 'pricing_detail',
  PRICE: 'price_detail',
};

export const DEFAULT_CATEGORY_DETAILS = [
  DETAIL_OPTIONS.NAME,
  DETAIL_OPTIONS.ITEMS,
  DETAIL_OPTIONS.SUBCATEGORIES,
  DETAIL_OPTIONS.PRICING,
];

export const DEFAULT_ITEM_DETAILS = [DETAIL_OPTIONS.NAME, DETAIL_OPTIONS.PRICE];
