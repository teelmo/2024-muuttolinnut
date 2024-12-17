import React, { } from 'react';
import PropTypes from 'prop-types';

import '../../styles/styles.less';

// Load components.
import Map from './Map.jsx';

function Live({ data }) {
  return (
    <>
      <div className="container">
        <div className="map_container">
          <Map values={data} update />
        </div>
      </div>
      <noscript>Your browser does not support JavaScript!</noscript>
    </>
  );
}

Live.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.array.isRequired
};

export default Live;
