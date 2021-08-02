import * as PropTypes from 'raydiant-kit/prop-types';

const { RAYDIANT_APP_LS_RETAIL_BASE_URL } = process.env;

const initialProps = {
  presentation: { values: {} },
  selectedPaths: [],
};

export default ({ presentation } = initialProps) => {
  const { authKey } = presentation.values;
  return {
    authKey: PropTypes.oAuth('connect to Lightspeed')
      .authUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/auth`)
      .verifyUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/verify`, 'auth_key')
      .logoutUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/logout`, 'auth_key')
      .required(),
    locationId: PropTypes.selection('select a business location')
      .optionsUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/locationOptions?auth_key={{authKey}}`)
      .hide(!authKey),
    duration: PropTypes.number('duration').min(5).default(120).helperText('time in seconds.'),
  };
};
