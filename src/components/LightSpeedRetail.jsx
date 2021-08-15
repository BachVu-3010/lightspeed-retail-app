import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRaydiantApp } from 'raydiant-kit';
import MenuLayout from 'raydiant-menu';

import useFetchMenu from './useFetchMenu';
import Loading from './Loading';
import logger from '../utils/logger';
import './styles.css';

const useFireError = (onError, authKey, locationId, categories, hasError) => {
  React.useEffect(() => {
    if (!authKey) {
      onError(new Error('Please connect to LightSpeed'));
      return;
    }
    if (locationId === 'none') {
      onError(new Error('No location found'));
      return;
    }
  }, [authKey, locationId, onError]);

  React.useEffect(() => {
    // not fire error if failed to updating inventory data
    if ((!categories || !categories.length) && hasError) {
      onError(new Error('Failed to fetch inventory'));
    }
  }, [categories, hasError, onError]);
};

export const LightSpeedRetail = ({
  presentation,
  device,
  isPlaying,
  isDashboard,
  isThumbnail,
  onReady,
  onComplete,
  onError,
}) => {
  const { authKey, locationId, duration } = presentation.values;

  // Set logger's context with current device
  useEffect(() => {
    logger.setContext({ deviceId: device && device.id });
  }, [device]);

  // onComplete triggers after duration
  useEffect(() => {
    let completeTimeout;
    if (isPlaying) {
      completeTimeout = setTimeout(onComplete, duration * 1000);
    }

    return () => completeTimeout && clearTimeout(completeTimeout);
  }, [duration, isPlaying, onComplete]); // Add the app's variable that can restart onComplete here

  // const [categories, loading, hasError] = [[], false, false];
  const [categories, loading, hasError] = useFetchMenu(presentation.values);

  useFireError(onError, authKey, locationId, categories, hasError);

  // fire onReady to show the loading spinner on dashboard preview
  React.useEffect(() => {
    if (loading && isDashboard) {
      onReady();
    }
  }, [onReady, isDashboard, loading]);

  if (loading) {
    return isDashboard ? <Loading title='Loading...' /> : null;
  }

  if (!categories || categories.length === 0) return null;

  return (
    <MenuLayout
      categories={categories}
      presentation={presentation}
      onError={onError}
      onReady={onReady}
      isPlaying={isPlaying}
      isThumbnail={isThumbnail}
    />
  );
};

LightSpeedRetail.propTypes = {
  presentation: PropTypes.shape({
    values: PropTypes.shape({
      authKey: PropTypes.string,
      locationId: PropTypes.string,
      duration: PropTypes.number,
    }),
  }).isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isThumbnail: PropTypes.bool,
  onReady: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

LightSpeedRetail.defaultProps = {
  isPlaying: false,
  onReady: () => {},
  onComplete: () => {},
  onError: () => {},
};

export default withRaydiantApp(LightSpeedRetail);
