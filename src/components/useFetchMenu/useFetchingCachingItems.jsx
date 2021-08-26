import React from 'react';
import groupBy from 'lodash.groupby';
import uniq from 'lodash.uniq';
import useDeepMemo from 'raydiant-menu/utils/useDeepMemo';

import { FETCHING_STATES, UPDATING_MENU_INTERVAL } from './constants';
import fetchWithRetries from './fetchWithRetries';
import { RAYDIANT_APP_LS_RETAIL_BASE_URL } from '../../constants';
import logger from '../../utils/logger';
import { isEmpty } from '../../utils';

const MAX_ALLOWED_ITEM_COUNT = 200;

const remove_matrix_prefix = (prefix) => ({ description, ...rest }) => ({
  ...rest,
  description: description.slice(prefix.length).trim(),
});

const merge_matrix_items = (items, matrices) => {
  if (!matrices || !items) return items;

  const matrixDescriptionById = {};
  matrices.forEach((matrix) => {
    matrixDescriptionById[matrix.itemMatrixID] = matrix.description;
  });

  const matrixItems = items.filter((item) => item.itemMatrixID && item.itemMatrixID !== '0');
  const matrixItemsByMatrixId = groupBy(matrixItems, 'itemMatrixID');

  const merged = [];
  const addedMatrixIds = [];
  items.forEach((item) => {
    if (item.itemMatrixID && item.itemMatrixID !== '0' && item.itemMatrixID in matrixItemsByMatrixId) {
      if (!addedMatrixIds.includes(item.itemMatrixID)) {
        const matrixDescription = matrixDescriptionById[item.itemMatrixID];
        merged.push({
          itemID: `matrix-${item.itemMatrixID}`,
          categoryID: item.categoryID,
          description: matrixDescription,
          variants: (matrixItemsByMatrixId[item.itemMatrixID] || []).map(remove_matrix_prefix(matrixDescription)),
        });
        addedMatrixIds.push(item.itemMatrixID);
      }
    } else {
      merged.push(item);
    }
  });
  return merged;
};

const toDict = (items, by) => {
  const dict = {};
  (items || []).forEach((item) => {
    dict[item[by]] = item;
  });
  return dict;
};

const toCacheId = (...args) => args.map(JSON.stringify).join('|');

const useCheckItemsCount = (authKey, categoryIds, itemIds, tags, onError) => {
  const [okCache, setOkCache] = React.useState({});
  const cacheId = useDeepMemo(toCacheId, [categoryIds, itemIds, tags]);

  // check item count
  React.useEffect(() => {
    const checkItemsCount = async () => {
      if (!!tags && !tags.length) {
        setOkCache((cache) => ({ ...cache, [cacheId]: true }));
        return;
      }

      if (!authKey || (isEmpty(categoryIds) && isEmpty(itemIds))) return true;

      try {
        const categoryIdsParam = categoryIds.sort().join(',');
        const itemIdsParam = itemIds.sort().join(',');
        const tagsQuery = !!tags && tags.length ? `&tags=${tags.join(',')}` : '';
        const { count } = await fetchWithRetries(
          `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/itemsCount?auth_key=${authKey}` +
            `&category_ids=${categoryIdsParam}&item_ids=${itemIdsParam}${tagsQuery}`
        );
        const ok = (count || 0) <= MAX_ALLOWED_ITEM_COUNT;
        setOkCache((cache) => ({ ...cache, [cacheId]: ok }));
      } catch (e) {
        logger.error(
          `Check items count failed with authKey ${authKey} categoryIds ${categoryIds} itemIds ${itemIds}`,
          e
        );
        setOkCache((cache) => ({ ...cache, [cacheId]: true }));
      }
    };

    checkItemsCount();
  }, [authKey, categoryIds, itemIds, tags, setOkCache, cacheId]);

  const ok = okCache[cacheId];
  React.useEffect(() => {
    if (ok === false) {
      onError(new Error('Too many items, please limit number of items by unselect some categories.'));
    }
  }, [ok, onError]);

  return ok;
};

const fetchInventory = async (authKey, categoryIds, itemIds, tags) => {
  if (!!tags && !tags.length) {
    return { fetchedItems: [], fetchedMatrices: [] };
  }

  const categoryIdsParam = categoryIds.sort().join(',');
  const itemIdsParam = itemIds.sort().join(',');
  const tagsQuery = !!tags && tags.length ? `&tags=${tags.join(',')}` : '';
  const fetchedItems = await fetchWithRetries(
    `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/items?auth_key=${authKey}` +
      `&category_ids=${categoryIdsParam}&item_ids=${itemIdsParam}${tagsQuery}`
  );
  const fetchedMatrices = await fetchWithRetries(
    `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/matrices?auth_key=${authKey}` +
      `&category_ids=${categoryIdsParam}&item_ids=${itemIdsParam}`
  );
  return { fetchedItems, fetchedMatrices };
};

export default (authKey, originalCategoryIds, originalItemIds, originalTags, onError) => {
  const [cache, setCache] = React.useState({ itemById: {}, fetchedCategoryIds: [] });
  const [fetchingState, setFetchingState] = React.useState(FETCHING_STATES.OK);

  // avoid unwanted changes
  const [categoryIds, itemIds, tags] = useDeepMemo((categoryIds, itemIds, tags) => [categoryIds, itemIds, tags], [
    originalCategoryIds.sort(),
    originalItemIds.sort(),
    originalTags && originalTags.sort(),
  ]);

  // reset cache
  React.useEffect(() => {
    setCache({ itemById: {}, fetchedCategoryIds: [] });
  }, [authKey, tags, setCache]);

  const countIsOk = !!useCheckItemsCount(authKey, categoryIds, itemIds, tags, onError);

  const fetchItems = React.useCallback(
    async (categoryIds, itemIds, tags) => {
      if (!authKey || (isEmpty(categoryIds) && isEmpty(itemIds))) return;

      try {
        const { fetchedItems, fetchedMatrices } = await fetchInventory(authKey, categoryIds, itemIds, tags);
        if (fetchedItems && fetchedMatrices) {
          const newItemById = toDict(merge_matrix_items(fetchedItems, fetchedMatrices), 'itemID');
          logger.info('new newItemById', newItemById);
          setCache(({ itemById, fetchedCategoryIds }) => ({
            itemById: { ...itemById, ...newItemById },
            fetchedCategoryIds: uniq([...fetchedCategoryIds, ...categoryIds]),
          }));
          setFetchingState(FETCHING_STATES.OK);
        } else {
          setFetchingState(FETCHING_STATES.ERROR);
        }
      } catch (e) {
        setFetchingState(FETCHING_STATES.ERROR);
        logger.error(`Fetching items failed with authKey ${authKey} categoryIds ${categoryIds} itemIds ${itemIds}`, e);
      }
    },
    [authKey, setCache, setFetchingState]
  );

  // fetch new items
  const [missingCategoryIds, missingItemIds] = useDeepMemo(
    (categoryIds, itemIds, { fetchedCategoryIds, itemById }) => {
      const missingCategoryIds = (categoryIds || []).filter((categoryId) => !fetchedCategoryIds.includes(categoryId));
      const missingItemIds = (itemIds || []).filter((itemId) => !(itemId in itemById));

      return [missingCategoryIds, missingItemIds];
    },
    [categoryIds, itemIds, cache]
  );
  React.useEffect(() => {
    if (isEmpty(missingCategoryIds) && isEmpty(missingItemIds)) return;

    setFetchingState(FETCHING_STATES.FETCHING);
    if (!countIsOk) return;

    fetchItems(missingCategoryIds, missingItemIds, tags);
  }, [fetchItems, missingCategoryIds, missingItemIds, tags, countIsOk, setFetchingState]);

  // set updating all items every UPDATING_MENU_INTERVAL
  React.useEffect(() => {
    if (!countIsOk) return;
    if (isEmpty(categoryIds) && isEmpty(categoryIds)) return;

    const updatingInterval = setInterval(() => fetchItems(categoryIds, itemIds, tags), UPDATING_MENU_INTERVAL);
    return () => updatingInterval && clearInterval(updatingInterval);
  }, [fetchItems, countIsOk, categoryIds, tags, itemIds]);

  const itemsByCategory = useDeepMemo(
    ({ itemById, fetchedCategoryIds }) => {
      const emptyByDefault = [];
      (fetchedCategoryIds || []).forEach((fetchedCategoryId) => {
        emptyByDefault[fetchedCategoryId] = [];
      });
      return { ...emptyByDefault, ...groupBy(Object.values(itemById), 'categoryID') };
    },
    [cache]
  );
  return [itemsByCategory, fetchingState];
};
