import * as PropTypes from 'raydiant-kit/prop-types';

const initialProps = {
  presentation: { values: {} },
  selectedPaths: [],
};

export default ({ presentation } = initialProps) => {
  const duration = PropTypes.number('duration').min(5).default(120).helperText('time in seconds.');

  return {
    duration,
  };
};
