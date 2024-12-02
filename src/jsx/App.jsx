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
    // const dataURL = (window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2023_lintureitti/js/vesku_aws_2024.json' : `${baseURL}assets/data/partial_route.json`;
    let values;
    try {
      values = Promise.all([
        fetch(`${baseURL}assets/data/info.json`),
        // fetch(`${baseURL}assets/data/route.json`)
        fetch(`${baseURL}assets/data/partial_route.json`)
        // fetch(`${dataURL}`)
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
