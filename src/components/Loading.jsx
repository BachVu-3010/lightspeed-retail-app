import React from 'react';

import './Loading.css';

export default ({ children, title }) => (
  <div className='loading-overlay'>
    <div className='loading-spinner' />
    <div className='loading-title'>{title}</div>
    <div className='loading-description'>{children}</div>
  </div>
);
