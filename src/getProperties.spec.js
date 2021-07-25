import './setupTest';
import getProperties from './getProperties';

const toPlainObject = (obj) => JSON.parse(JSON.stringify(obj));

describe('getProperties', () => {
  it('should return enough controls', () => {
    const properties = toPlainObject(getProperties({ presentation: { values: {} } }));

    properties.should.have.properties(['duration']);
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
