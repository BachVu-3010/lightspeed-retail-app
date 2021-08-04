import './setupTest';
import getProperties from './getProperties';

const toPlainObject = (obj) => JSON.parse(JSON.stringify(obj));

describe('getProperties', () => {
  it('should return enough controls', () => {
    const properties = toPlainObject(getProperties({ presentation: { values: {} } }));

    properties.should.have.properties(['authKey', 'duration']);
  });

  describe('authKey', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.authKey.should.eql({
        label: 'connect to Lightspeed',
        type: 'oAuth',
        optional: false,
        constraints: {},
        authUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/auth',
        verifyUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/verify',
        verifyQsParam: 'auth_key',
        logoutUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/logout',
        logoutQsParam: 'auth_key',
      });
    });
  });

  describe('locationId', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.locationId.should.eql({
        label: 'select a business location',
        type: 'selection',
        optional: true,
        constraints: {},
        options: [],
        optionsUrl: 'TEST_RAYDIANT_APP_LS_RETAIL_BASE_URL/locationOptions?auth_key={{authKey}}',
        hide: true,
      });
    });

    it('should be shown after ls is connected', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: { authKey: 'auth-key' } } }));
      properties.locationId.hide.should.be.false();
    });
  });

  describe('duration', () => {
    it('should have correct attributes', () => {
      const properties = toPlainObject(getProperties({ presentation: { values: {} } }));
      properties.duration.should.eql({
        label: 'duration',
        type: 'number',
        optional: true,
        constraints: { min: 5 },
        default: 120,
        helperText: 'time in seconds.',
      });
    });
  });
});
