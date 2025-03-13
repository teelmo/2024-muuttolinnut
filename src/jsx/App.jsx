import React, {
  useState, useEffect, /* useCallback, useMemo */
} from 'react';
import '../styles/styles.less';

// Load components.
import Live from './components/Live.jsx';

function App() {
  // Data states.
  const [data, setData] = useState(false);

  const fetchExternalData = () => {
    const baseURL = (window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './';
    const dataURL = (window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2023_lintureitti/js/lintu_aws_2025.json' : 'https://www.movebank.org/movebank/service/public/json?study_id=5834114704&individual_local_identifiers=243726&sensor_type=gps&attributes=timestamp,location_long,location_lat,height_above_msl,ground_speed,gps_satellite_count,external_temperature';
    let values;
    try {
      values = Promise.all([
        fetch(`${baseURL}assets/data/info.json`),
        fetch(dataURL)
      ]).then(results => Promise.all(results.map(result => result.json())));
    } catch (error) {
      console.error(error);
    }
    return values;
  };

  useEffect(() => {
    fetchExternalData().then(result => {
      setData(result);
    }).catch(console.error);
  }, []);

  return (
    <div className="app">
      <div className="container">
        <div className="content">
          {data && <Live data={data} />}
        </div>
      </div>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
}

export default App;
