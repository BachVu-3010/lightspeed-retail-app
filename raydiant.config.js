import getProperties from './src/getProperties';

export default {
  name: 'Lightspeed Retail',
  description: 'Description for Lightspeed Retail',
  callToAction: 'Create Lightspeed Retail',
  properties: getProperties(),
  simulator: {
    presentations: [{ name: 'New Presentation' }],
  },
};
