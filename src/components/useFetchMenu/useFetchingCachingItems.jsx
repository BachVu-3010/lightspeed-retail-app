import React from 'react';
import groupBy from 'lodash.groupby';
import useDeepMemo from 'raydiant-menu/utils/useDeepMemo';

import { FETCHING_STATES, UPDATING_MENU_INTERVAL } from './constants';
import fetchWithRetries from './fetchWithRetries';
import { RAYDIANT_APP_LS_RETAIL_BASE_URL } from '../../constants';
import logger from '../../utils/logger';

const fetchAll = async (url, offset = 0) => {
  const response = await fetchWithRetries(`${url}&offset=${offset}`);
  if (!response) return undefined;

  const items = response.items || [];
  const pagination = response.pagination || {};
  if (!pagination.count || !pagination.limit) return items;

  const count = parseInt(pagination.count || '0', 10);
  const limit = parseInt(pagination.limit || '0', 10);
  if (offset + limit >= count) return items;

  const nextItems = await fetchAll(url, offset + limit);
  return items.concat(...nextItems);
};

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

export default (authKey, categoryIds) => {
  const [itemsByCategory, setItemsByCategory] = React.useState({});
  const [fetchingState, setFetchingState] = React.useState(FETCHING_STATES.OK);

  const fetchItems = React.useCallback(
    async (categoryIds) => {
      if (!authKey || !categoryIds || !categoryIds.length) return;

      try {
        const categoryIdsParam = categoryIds.join(',');
        const fetchedItems = await fetchAll(
          `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/items?auth_key=${authKey}&category_ids=${categoryIdsParam}`
        );
        const fetchedMatrices = await fetchAll(
          `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/matrices?auth_key=${authKey}&category_ids=${categoryIdsParam}`
        );

        if (fetchedItems && fetchedMatrices) {
          const newItems = merge_matrix_items(fetchedItems, fetchedMatrices);
          let newItemsByCategory = {};
          // avoid infinite fetching since some category doesn't have items
          categoryIds.forEach((categoryId) => (newItemsByCategory[categoryId] = []));
          newItemsByCategory = { ...newItemsByCategory, ...groupBy(newItems, 'categoryID') };
          logger.info('new itemsByCategory', newItemsByCategory);
          setItemsByCategory((itemsByCategory) => ({ ...itemsByCategory, ...newItemsByCategory }));
          setFetchingState(FETCHING_STATES.OK);
        } else {
          setFetchingState(FETCHING_STATES.ERROR);
        }
      } catch (e) {
        setFetchingState(FETCHING_STATES.ERROR);
        logger.error(`Exception while fetching items with authKey ${authKey}`, e);
      }
    },
    [authKey, setItemsByCategory, setFetchingState]
  );

  React.useEffect(() => setItemsByCategory({}), [authKey, setItemsByCategory]);

  const missingCategoryIds = useDeepMemo(
    () => (categoryIds || []).filter((categoryId) => !(categoryId in itemsByCategory)),
    [categoryIds, itemsByCategory]
  );
  React.useEffect(() => {
    if (!missingCategoryIds || !missingCategoryIds.length) return;

    setFetchingState(FETCHING_STATES.FETCHING);
    fetchItems(missingCategoryIds);
  }, [fetchItems, missingCategoryIds, setFetchingState]);

  React.useEffect(() => {
    const updatingInterval = setInterval(() => fetchItems(categoryIds), UPDATING_MENU_INTERVAL);
    return () => updatingInterval && clearInterval(updatingInterval);
  }, [fetchItems, categoryIds]);

  return [itemsByCategory, fetchingState];
};
