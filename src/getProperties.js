import * as PropTypes from 'raydiant-kit/prop-types';
import getMenuProperties from 'raydiant-menu/properties';

import { CategorySelection } from './utils/selections';
import isValidId from './utils/isValidId';
import { OUT_OF_STOCK_OPTIONS, RAYDIANT_APP_LS_RETAIL_BASE_URL } from './constants';

const initialProps = {
  presentation: { values: {} },
  builderState: {},
};

export default ({ presentation, builderState } = initialProps) => {
  const { authKey, locationId } = presentation.values;
  const showDetails = authKey && isValidId(locationId);

  const {
    theme,
    qrActive,
    qrSource,
    qrUrlContent,
    qrImage,
    qrSize,
    qrCallToAction,
    ...otherMenuProps
  } = getMenuProperties(presentation);

  return {
    authKey: PropTypes.oAuth('Connect to Lightspeed')
      .authUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/auth`)
      .verifyUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/verify`, 'auth_key')
      .logoutUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/logout`, 'auth_key')
      .required(),
    locationId: PropTypes.selection('select a business location')
      .optionsUrl(`${RAYDIANT_APP_LS_RETAIL_BASE_URL}/locationOptions?auth_key={{authKey}}`)
      .hide(!authKey),
    ...(showDetails && new CategorySelection().getProps(presentation.values, builderState)),
    ...(showDetails && {
      ...otherMenuProps,
      outOfStockAction: PropTypes.toggleButtonGroup('out of stock items')
        .exclusive()
        .option(OUT_OF_STOCK_OPTIONS.LEAVE_IT, 'Leave it')
        .option(OUT_OF_STOCK_OPTIONS.REMOVE, 'Remove')
        .option(OUT_OF_STOCK_OPTIONS.STRIKETHROUGH, 'Strikethrough')
        .default(OUT_OF_STOCK_OPTIONS.DEFAULT),
      theme,
      qrActive,
      qrSource,
      qrUrlContent,
      qrImage,
      qrSize,
      qrCallToAction,
    }),
    duration: PropTypes.number('duration').min(5).default(120).helperText('time in seconds.'),
  };
};
