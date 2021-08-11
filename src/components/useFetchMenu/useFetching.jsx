import React from 'react';
import deepEqual from 'lodash.isequal';

import { RAYDIANT_APP_LS_RETAIL_BASE_URL } from '../../constants';
import isValidId from '../../utils/isValidId';
import logger from '../../utils/logger';
import { FETCHING_STATES, UPDATING_MENU_INTERVAL } from './constants';
import fetchWithRetries from './fetchWithRetries';

const useFetching = (url) => {
  const [data, setData] = React.useState(null);
  const [fetchingState, setFetchingState] = React.useState(FETCHING_STATES.OK);

  React.useEffect(() => {
    setData(null);
    if (!url) return;
    setFetchingState(FETCHING_STATES.FETCHING);

    const fetchData = async () => {
      try {
        const fetchedData = await fetchWithRetries(url);
        if (fetchedData) {
          logger.info('new fetched data', fetchedData);
          setData((currentData) => (deepEqual(currentData, fetchedData) ? currentData : fetchedData));
          setFetchingState(FETCHING_STATES.OK);
        } else {
          setFetchingState(FETCHING_STATES.ERROR);
        }
      } catch (e) {
        setFetchingState(FETCHING_STATES.ERROR);
        logger.error(`Exception while fetching data with url ${url}`, e);
      }
    };

    fetchData();
    const updatingInterval = setInterval(fetchData, UPDATING_MENU_INTERVAL);
    return () => updatingInterval && clearInterval(updatingInterval);
  }, [url, setData, setFetchingState]);

  return [data, fetchingState];
};

export const useFetchingCategories = (authKey) => {
  const categoryUrl = authKey ? `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/categories?auth_key=${authKey}` : undefined;
  return useFetching(categoryUrl);
};

export const useFetchingLocation = (authKey, locationId) => {
  const locationUrl =
    authKey && isValidId(locationId)
      ? `${RAYDIANT_APP_LS_RETAIL_BASE_URL}/location/${locationId}?auth_key=${authKey}`
      : undefined;
  return useFetching(locationUrl);
};
