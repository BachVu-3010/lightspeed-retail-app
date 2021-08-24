import React from 'react';
import useDeepMemo from 'raydiant-menu/utils/useDeepMemo';

import Menu from './Menu';
import useFetchingCachingItems from './useFetchingCachingItems';
import { FETCHING_STATES } from './constants';
import { useFetchingCategories, useFetchingLocation } from './useFetching';

const getFilteringValues = ({
  auth,
  locationId,
  shouldFormatPrice,
  currency,
  priceFormat,
  layout,
  image,
  enableAnimation,
  footnote,
  footnoteSize,
  theme,
  duration,
  qrActive,
  qrSource,
  qrUrlContent,
  qrImage,
  qrSize,
  qrCallToAction,
  ...rest
}) => rest;

export default (presentationValues, onError) => {
  const { authKey, locationId, shouldFilterByTags, tags } = presentationValues;

  const [categories, categoryFetchingState] = useFetchingCategories(authKey);
  const [location, locationFetchingState] = useFetchingLocation(authKey, locationId);
  const menu = useDeepMemo((categories) => new Menu(categories), [categories]);

  const filteringValues = getFilteringValues(presentationValues);
  const { categoryIds, itemIds } = useDeepMemo((menu, values) => menu.getActiveIds(values), [menu, filteringValues]);
  const activeTags = React.useMemo(() => (shouldFilterByTags ? tags : undefined), [shouldFilterByTags, tags]);
  const [itemsByCategory, itemFetchingState] = useFetchingCachingItems(
    authKey,
    categoryIds,
    itemIds,
    activeTags,
    onError
  );

  const renderingCategories = useDeepMemo(
    (menu, values, itemsByCategory, location) => menu.build(values, itemsByCategory, location),
    [menu, filteringValues, itemsByCategory, location]
  );
  const fetchingStates = [categoryFetchingState, locationFetchingState, itemFetchingState];
  const loading = fetchingStates.some((state) => state === FETCHING_STATES.FETCHING);
  const hasError = fetchingStates.some((state) => state === FETCHING_STATES.ERROR);
  return [renderingCategories, loading, hasError];
};
