import React, { } from 'react';
import PropTypes from 'prop-types';

import '../../styles/styles.less';

// https://www.npmjs.com/package/uuid4
import uuid4 from 'uuid4';

// Load components.
import Map from './Map.jsx';

function Live({ data }) {
  const refreshPage = () => {
    window.location.replace(window.location.href);
  };
  return (
    <>
      <div className="container">
        <div className="map_container">
          <div className="change_view_container">
            <button type="button" onClick={() => refreshPage()} className="change_view">Lataa uudelleen</button>
          </div>
          <Map values={data} update />
        </div>
        <div className="live_feed">
          {
            data && data[0].map_feed_example.map(el => (
              <div className="live_feed_content" key={uuid4()}>
                <h4 className="date">{el.date}</h4>
                <h3 className="title">{el.title}</h3>
                {
                  el.text.map(text => <p key={uuid4()}>{text}</p>)
                }
                <div className="image_container">
                  <img src={el.img} alt={el.img_alt} />
                </div>
              </div>
            ))
          }
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

Live.defaultProps = {
};

export default Live;
