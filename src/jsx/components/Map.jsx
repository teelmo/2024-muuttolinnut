import React, {
  useEffect, useCallback, useRef, useState
} from 'react';
import PropTypes from 'prop-types';

import '../../styles/styles.less';

// https://www.npmjs.com/package/mapbox-gl
import mapboxgl from 'mapbox-gl';
// https://turfjs.org/getting-started/
import * as turf from '@turf/turf';

// https://docs.mapbox.com/mapbox-gl-js/guides/
// https://docs.mapbox.com/mapbox-gl-js/example/globe/
// https://docs.mapbox.com/mapbox-gl-js/api/properties/
// https://docs.mapbox.com/mapbox-gl-js/example/free-camera-path/
mapboxgl.accessToken = 'pk.eyJ1IjoieWxlaXNyYWRpbyIsImEiOiJjam90cTB4N3gxMGxjM3dsaDVsendub3N1In0.wL_Mc8cux0MxxhuUZWewJg';

function Map({ update, values }) {
  const [data, setData] = useState(false);
  const [odometer, setOdometer] = useState(0);

  // eslint-disable-next-line
  const tracedata = useRef({ 'type': 'FeatureCollection', 'features': [{ 'type': 'Feature', 'properties': {}, 'geometry': { 'type': 'LineString', 'coordinates': [] } }] });
  const curvedLineDataPoint = useRef([]);
  const curvedLineDataPointPredicted = useRef([]);
  const map1 = useRef(false);
  const map1Container = useRef(null);

  const calculateBearing = (start, end) => {
    const coordinates1 = start;
    const coordinates2 = end;
    const lon1 = turf.degreesToRadians(coordinates1[0]);
    const lon2 = turf.degreesToRadians(coordinates2[0]);
    const lat1 = turf.degreesToRadians(coordinates1[1]);
    const lat2 = turf.degreesToRadians(coordinates2[1]);
    const a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const b = Math.cos(lat1) * Math.sin(lat2)
            - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    return turf.radiansToDegrees(Math.atan2(a, b));
  };

  const createMap = useCallback((lineDataPoint, result_data) => {
    const routeDistance = turf.lineDistance(curvedLineDataPoint.current);
    setOdometer(Math.round(routeDistance));

    map1.current = new mapboxgl.Map({
      // center: lineDataPoint[0], // starting position [lng, lat]
      center: lineDataPoint[lineDataPoint.length - 1], // starting position [lng, lat]
      container: map1Container.current, // container ID
      language: 'fi',
      style: 'mapbox://styles/mapbox/satellite-streets-v11', // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      zoom: 4 // starting zoom
    });
    map1.current.on('load', () => {
      map1.current.addControl(new mapboxgl.NavigationControl());
      map1.current.addSource('LineString', {
        data: {
          geometry: {
            coordinates: curvedLineDataPoint.current.geometry.coordinates,
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        },
        type: 'geojson'
      });

      map1.current.addSource('LineStringPredicted', {
        data: {
          geometry: {
            coordinates: curvedLineDataPointPredicted.current.geometry.coordinates,
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        },
        type: 'geojson'
      });

      map1.current.addLayer({
        id: 'LineS_small_predicted',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': 'rgba(233, 14, 67, 0.7)',
          'line-width': 7,
          'line-dasharray': [1, 2]
        },
        source: 'LineStringPredicted',
        type: 'line'
      });

      map1.current.addLayer({
        id: 'LineS_small',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': 'rgba(87, 229, 222, 0.7)',
          'line-width': 7
        },
        source: 'LineString',
        type: 'line'
      });

      map1.current.addSource('last', {
        data: {
          geometry: {
            coordinates: lineDataPoint[0],
            type: 'Point'
          },
          properties: {},
          type: 'Feature'
        },
        type: 'geojson'
      });

      map1.current.loadImage(`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/bird2.png`, (error, image) => {
        if (error) throw error;
        // add image to the active style and make it SDF-enabled
        map1.current.addImage('bird', image, { sdf: true });
      });

      map1.current.addLayer(
        {
          id: 'bird',
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'bird',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.1, 8, 0.2],
            'icon-rotate': calculateBearing(lineDataPoint[0], lineDataPoint[1])
          },
          paint: {
            'icon-color': '#fff'
          },
          source: 'last',
          type: 'symbol'
        }
      );

      // https://docs.mapbox.com/mapbox-gl-js/example/live-update-feature/
      // start by showing just the first coordinate
      tracedata.current = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }] };
      tracedata.current.features[0].geometry.coordinates = [curvedLineDataPoint.current.geometry.coordinates[0]];
      // // add it to the map
      map1.current.addSource('trace', { type: 'geojson', data: tracedata.current });
      map1.current.addLayer({
        id: 'trace',
        type: 'line',
        source: 'trace',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00b4ff',
          'line-opacity': 1,
          'line-width': 7
        }
      });
      // https://docs.mapbox.com/help/tutorials/custom-markers-gl-js/
      result_data[0].map_markers_example.forEach((feature) => {
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
          )).addTo(map1.current);
      });
    });
  }, []);

  const cleanFlightData = useCallback((result) => {
    const lineDataPoint = [];
    result[1]['JX.1442466'].forEach((map_point) => {
      const pointDate = new Date(map_point.d);

      if (pointDate.getFullYear() >= 2019 && pointDate.getMonth() >= 1) {
        lineDataPoint.push([map_point.y, map_point.x]);
      }
    });
    const lineDataPointPredicted = [];
    result[1].predicted.forEach((map_point) => {
      const pointDate = new Date(map_point.d);

      if (pointDate.getFullYear() >= 2019 && pointDate.getMonth() >= 1) {
        lineDataPointPredicted.push([map_point.y, map_point.x]);
      }
    });
    curvedLineDataPoint.current = turf.bezierSpline(turf.lineString(lineDataPoint), {
      sharpness: 0,
      resolution: 60000
    });
    curvedLineDataPointPredicted.current = turf.bezierSpline(turf.lineString(lineDataPointPredicted), {
      sharpness: 0,
      resolution: 60000
    });

    createMap(lineDataPoint, result);
    return lineDataPoint;
  }, [createMap]);

  useEffect(() => {
    setData(values);
  }, [values]);

  const loadMap = useCallback(() => {
    const lineDataPoint = cleanFlightData(data);
    const lastData = {
      geometry: {
        coordinates: lineDataPoint[lineDataPoint.length - 1],
        type: 'Point'
      },
      properties: {},
      type: 'Feature'
    };
    map1.current.on('load', () => {
      map1.current.setLayoutProperty('bird', 'icon-rotate', calculateBearing(lineDataPoint[lineDataPoint.length - 2], lineDataPoint[lineDataPoint.length - 1]));
      map1.current.getSource('last').setData(lastData);
    });
  }, [cleanFlightData, data]);

  useEffect(() => {
    if (update === true) {
      if (map1.current) map1.current.resize();
    }
  }, [update]);

  useEffect(() => {
    if (data) {
      loadMap();
    }
  }, [data, loadMap]);

  return (
    <div className="map_wrapper">
      <div className="maps_container">
        <div className="odometer">
          {odometer}
          {' '}
          km
        </div>
        <div ref={map1Container} className="main_map" />
      </div>
      <p className="updated_info">
        Tiedot päivitetty:
        {' '}
        {`${(new Date(values[1].updated)).getDate()}.${(new Date(values[1].updated)).getMonth() + 1}.${(new Date(values[1].updated)).getFullYear()}`}
      </p>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
}

Map.propTypes = {
  update: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  values: PropTypes.array.isRequired
};

Map.defaultProps = {
};

export default Map;
