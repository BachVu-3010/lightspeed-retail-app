import getProperties from './src/getProperties';

export default {
  name: 'AppName',
  description: 'Description for AppName',
  callToAction: 'Create AppName',
  properties: getProperties(),
  simulator: {
    presentations: [{ name: 'New Presentation' }],
  },
};
