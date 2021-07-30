import * as PropTypes from 'raydiant-kit/prop-types';

const { RAYDIANT_APP_LS_RETAIL_BASE_URL } = process.env;

const initialProps = {
  presentation: { values: {} },
  selectedPaths: [],
};

export default ({ presentation } = initialProps) => {
  return {
    authKey: PropTypes.oAuth('connect to Lightspeed')
      .authUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/auth`)
      .verifyUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/verify`, 'auth_key')
      .logoutUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/logout`, 'auth_key')
      .required(),
    duration: PropTypes.number('duration').min(5).default(120).helperText('time in seconds.'),
  };
};
