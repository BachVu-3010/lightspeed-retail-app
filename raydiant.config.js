import getProperties from './src/getProperties';

export default {
  name: 'Lightspeed Retail',
  description: 'Connect to Lightspeed for custom dynamic product & service displays',
  callToAction: 'Create Lightspeed Retail Display',
  properties: getProperties(),
  simulator: {
    presentations: [{ name: 'New Presentation' }],
  },
};
