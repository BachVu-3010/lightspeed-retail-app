import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRaydiantApp } from 'raydiant-kit';

import logger from '../utils/logger';
import './styles.css';

export const AppName = ({ presentation: { values }, device, isPlaying, onReady, onComplete, onError }) => {
  const { duration } = values;

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

  // onReady on mount
  useEffect(onReady, [onReady]);

  // logging for changes
  useEffect(() => {
    logger.info(`Render with duration: ${duration}`);
  }, [duration]);

  return (
    <main>
      <h1>RaydiantKit</h1>
      <h2>Screen signage SDK</h2>
      <p>
        For documentation and examples check out{' '}
        <a href='https://github.com/mirainc/raydiant-kit' target='_blank' rel='noopener noreferrer'>
          github.com/mirainc/raydiant-kit
        </a>
        .
      </p>
    </main>
  );
};

AppName.propTypes = {
  presentation: PropTypes.shape({
    values: PropTypes.shape({
      duration: PropTypes.number,
    }),
  }).isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isThumbnail: PropTypes.bool,
  onReady: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

AppName.defaultProps = {
  isPlaying: false,
  onReady: () => {},
  onComplete: () => {},
  onError: () => {},
};

export default withRaydiantApp(AppName);
