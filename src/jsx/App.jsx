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
    const dataURL = (window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2023_lintureitti/js/lintu_aws_2025.json' : 'https://www.movebank.org/movebank/service/public/json?study_id=5834114704&individual_local_identifiers=243727&sensor_type=gps&attributes=timestamp,location_long,location_lat,height_above_msl,ground_speed,gps_satellite_count,external_temperature';
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
    fetchExternalData()
      .then((result) => {
        const maxSpeedKMH = 100; // Maximum reasonable speed for Larus fuscus in km/h
        const minSatellites = 5; // Minimum required satellites for a reliable GPS fix
        const maxLatDifference = 0.5; // Maximum allowed latitude change in degrees (roughly ~50 km)
        const maxLonDifference = 1.0; // Maximum allowed longitude change in degrees (roughly ~100 km)
        const minLocationChange = 0.001; // Minimum allowed change in latitude/longitude for valid movement (roughly a few meters)

        const suspiciousTimestamps = [
          1742716113000,
          1742716417000,
          1742716713000,
          1742731410000,
          1742671748000,
          1742672034000,
          1742672893000,
          1742673189000,
          1742675003000,
          1742679247000,
          1742681938000
        ];

        // Function to calculate great-circle distance (Haversine formula)
        function haversineDistance(lat1, lon1, lat2, lon2) {
          const R = 6371; // Earth radius in km
          const toRad = (deg) => (deg * Math.PI) / 180;

          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          return R * c; // Distance in km
        }

        // Function to filter out unreliable locations
        function filterUnreliableLocations(locations) {
          return locations.filter((curr, index, arr) => {
            if (curr.gps_satellite_count < minSatellites) return false; // Remove if satellites are too low
            if (index === 0) return true; // Keep first valid entry

            const prev = arr[index - 1];
            const distance = haversineDistance(prev.location_lat, prev.location_long, curr.location_lat, curr.location_long);
            const timeDiff = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60); // Convert ms to hours
            const speed = distance / timeDiff; // Speed in km/h

            // 1. Check if the bird has moved too far (latitude and longitude separately)
            const latDiff = Math.abs(curr.location_lat - prev.location_lat);
            const lonDiff = Math.abs(curr.location_long - prev.location_long);

            // If both latitude and longitude change by less than the threshold, consider the movement insignificant
            if (latDiff < minLocationChange && lonDiff < minLocationChange) {
              return false; // Discard if movement is too small
            }

            // 2. Check if the latitude or longitude changes more than the maximum allowed difference
            if (latDiff > maxLatDifference || lonDiff > maxLonDifference) {
              return false; // Discard if either latitude or longitude changes exceed the maximum difference
            }
            if (parseInt(curr.location_lat, 10) === 13) {
              if (curr.location_lat !== 13.625954627990723) {
                return false;
              }
            }
            if (parseInt(curr.location_lat, 10) === 15) {
              return false;
            }
            if (parseInt(curr.location_lat, 10) === 16) {
              if (curr.location_lat !== 16.14760971069336) {
                return false;
              }
            }
            if (parseInt(curr.location_lat, 10) === 18) {
              return false;
            }
            if (parseInt(curr.location_lat, 10) === 19) {
              if (curr.location_lat < 19.2) {
                return false;
              }
            }

            // 3. Check that the bird is not moving southward (latitudes should only increase)
            if (curr.location_lat < prev.location_lat) {
              return false; // Discard if moving southward
            }

            // 4. Check if the timestamp is in the list of suspicious timestamps
            if (suspiciousTimestamps.includes(curr.timestamp)) {
              return false; // Discard if timestamp matches any suspicious timestamp
            }

            // Log the speed to ensure it's below the threshold
            return speed <= maxSpeedKMH; // Keep entry if speed is reasonable
          });
        }

        // Apply filtering before setting data
        const cutoffTimestamp = new Date('2025-03-18T00:00:00Z').getTime();
        result[1].individuals[0].locations = filterUnreliableLocations(
          result[1].individuals[0].locations.filter(el => el.timestamp > cutoffTimestamp)
        );

        setData(result);
      })
      .catch(console.error);
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
