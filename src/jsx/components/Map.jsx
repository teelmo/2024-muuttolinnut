import React, {
  useEffect, useCallback, useRef, useState
} from 'react';
import PropTypes from 'prop-types';

import '../../styles/styles.less';

// eslint-disable-next-line
import scrollIntoView from 'scroll-into-view';

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
  const [odometer2, setOdometer2] = useState(0);

  const tracedata = useRef({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }] });
  const tracedata2 = useRef({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }] });
  const curvedLineDataPoint = useRef([]);
  const curvedLineDataPoint2 = useRef([]);
  const curvedLineDataPointPredicted = useRef([]);
  const map = useRef(false);
  const mapContainer = useRef(null);

  const calculateBearing = (start, end) => {
    const coordinates1 = start;
    const coordinates2 = end;
    const lon1 = turf.degreesToRadians(coordinates1[0]);
    const lon2 = turf.degreesToRadians(coordinates2[0]);
    const lat1 = turf.degreesToRadians(coordinates1[1]);
    const lat2 = turf.degreesToRadians(coordinates2[1]);
    const a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    return turf.radiansToDegrees(Math.atan2(a, b));
  };

  const createMap = useCallback((lineDataPoint, lineDataPoint2, result_data) => {
    const routeDistance = turf.lineDistance(curvedLineDataPoint.current);
    const routeDistance2 = turf.lineDistance(curvedLineDataPoint2.current);
    setOdometer(Math.round(routeDistance));
    setOdometer2(Math.round(routeDistance2));
    map.current = new mapboxgl.Map({
      center: [lineDataPoint2[lineDataPoint.length - 1][0], lineDataPoint2[lineDataPoint.length - 1][1] + 12.5], // starting position [lng, lat]
      container: mapContainer.current,
      cooperativeGestures: true,
      language: 'fi',
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      zoom: 3 // Starting zoom
    });
    map.current.scrollZoom.disable();
    map.current.on('load', () => {
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

      // Bird 1
      map.current.addSource('LineString', {
        data: {
          geometry: {
            coordinates: curvedLineDataPoint.current.geometry.coordinates,
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        },
        lineMetrics: true,
        type: 'geojson'
      });
      map.current.addLayer({
        id: 'LineS_small',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          // 'line-blur': 1,
          'line-color': '#f0f0f0',
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0,
            '#f0f0f0',
            1,
            '#cccccc'
          ],
          'line-opacity': 1,
          'line-width': 5
        },
        source: 'LineString',
        type: 'line'
      });
      map.current.addSource('last', {
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

      // Bird 2
      map.current.addSource('LineString_2', {
        data: {
          geometry: {
            coordinates: curvedLineDataPoint2.current.geometry.coordinates,
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        },
        lineMetrics: true,
        type: 'geojson'
      });
      map.current.addLayer({
        id: 'LineS_small_2',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          // 'line-blur': 1,
          'line-color': '#3e1ee0',
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0,
            '#3e1ee0',
            1,
            '#d575ff'
          ],
          'line-opacity': 1,
          'line-width': 5
        },
        source: 'LineString_2',
        type: 'line'
      });
      map.current.addSource('last2', {
        data: {
          geometry: {
            coordinates: lineDataPoint2[0],
            type: 'Point'
          },
          properties: {},
          type: 'Feature'
        },
        type: 'geojson'
      });

      // Predicted
      map.current.addSource('LineStringPredicted', {
        data: {
          geometry: {
            coordinates: curvedLineDataPointPredicted.current.geometry.coordinates,
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        },
        lineMetrics: true,
        type: 'geojson'
      });
      map.current.addLayer({
        id: 'LineS_small_predicted',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          // 'line-blur': 1,
          'line-color': '#bb80ff',
          'line-dasharray': [1, 2],
          'line-opacity': 1,
          'line-width': 5
        },
        source: 'LineStringPredicted',
        type: 'line'
      });

      map.current.loadImage(`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/bird2.png`, (error, image) => {
        if (error) throw error;
        // Add image to the active style and make it SDF-enabled
        map.current.addImage('bird', image, { sdf: true });
      });

      map.current.addLayer(
        {
          id: 'bird',
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'bird',
            'icon-rotate': calculateBearing(lineDataPoint[0], lineDataPoint[1]),
            'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.2, 8, 0.2]
          },
          paint: {
            'icon-color': '#fff'
          },
          source: 'last',
          type: 'symbol'
        }
      );

      map.current.addLayer(
        {
          id: 'bird2',
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'bird',
            'icon-rotate': calculateBearing(lineDataPoint2[0], lineDataPoint2[1]),
            'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.2, 8, 0.2]
          },
          paint: {
            'icon-color': '#fff'
          },
          source: 'last2',
          type: 'symbol'
        }
      );

      // https://docs.mapbox.com/mapbox-gl-js/example/live-update-feature/
      // Start by showing just the first coordinate
      // tracedata.current = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }] };
      tracedata.current.features[0].geometry.coordinates = [curvedLineDataPoint.current.geometry.coordinates[0]];
      tracedata2.current.features[0].geometry.coordinates = [curvedLineDataPoint2.current.geometry.coordinates[0]];
      // Add it to the map
      map.current.addSource('trace', { type: 'geojson', data: tracedata.current });
      map.current.addSource('trace2', { type: 'geojson', data: tracedata2.current });
      map.current.addLayer({
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
      map.current.addLayer({
        id: 'trace2',
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
      result_data[0].map_markers.forEach((feature) => {
        const el = document.createElement('div');
        el.className = 'marker';
        // if (feature.properties.post_id === '64-3-251104') {
        const divElement = document.createElement('div');
        divElement.innerHTML = `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`;

        const buttonContainer = document.createElement('div');
        // buttonContainer.innerHTML = `<button data-id=${feature.properties.post_id}>Mene postaukseen</button>`;
        divElement.appendChild(buttonContainer);

        // buttonContainer.querySelector('button').addEventListener('click', (e) => {
        //   scrollTo(e.currentTarget.dataset.id);
        // });
        const marker = new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates);
        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(divElement);
        marker.setPopup(popup).addTo(map.current);
        marker.getElement().addEventListener('click', () => {
          document.querySelector('.pan_controls').style.display = 'none';
        });
        popup.on('close', () => {
          document.querySelector('.pan_controls').style.display = 'block';
        });
        // } else {
        //   const marker = new mapboxgl.Marker(el)
        //     .setLngLat(feature.geometry.coordinates).addTo(map.current);
        //   // Attach event listener to raw HTML element
        //   marker.getElement().addEventListener('click', () => {
        //     scrollTo(feature.properties.post_id);
        //   });
        // }
      });
    });
  }, [/* scrollTo */]);

  const cleanFlightData = useCallback((result) => {
    // Bird 1
    const lineDataPoint = [];
    result[1].individuals[0].locations.forEach((map_point) => {
      lineDataPoint.push([map_point.location_long, map_point.location_lat]);
    });
    curvedLineDataPoint.current = turf.bezierSpline(turf.lineString(lineDataPoint), {
      sharpness: 0,
      resolution: 60000
    });
    // Bird 2
    const lineDataPoint2 = [];
    result[2].individuals[0].locations.forEach((map_point) => {
      lineDataPoint2.push([map_point.location_long, map_point.location_lat]);
    });
    curvedLineDataPoint2.current = turf.bezierSpline(turf.lineString(lineDataPoint2), {
      sharpness: 0,
      resolution: 60000
    });
    // Predicted
    const lineDataPointPredicted = [];
    result[0].predicted.forEach((map_point) => {
      if (map_point.y !== 0 || map_point.x !== 0) {
        lineDataPointPredicted.push([map_point.x, map_point.y]);
      }
    });
    curvedLineDataPointPredicted.current = turf.bezierSpline(turf.lineString(lineDataPointPredicted), {
      sharpness: 0,
      resolution: 60000
    });

    createMap(lineDataPoint, lineDataPoint2, result);
    return [lineDataPoint, lineDataPoint2];
  }, [createMap]);

  useEffect(() => {
    setData(values);
  }, [values]);

  const loadMap = useCallback(() => {
    const [lineDataPoint, lineDataPoint2] = cleanFlightData(data);
    const lastData = {
      geometry: {
        coordinates: lineDataPoint[lineDataPoint.length - 1],
        type: 'Point'
      },
      properties: {},
      type: 'Feature'
    };
    const lastData2 = {
      geometry: {
        coordinates: lineDataPoint2[lineDataPoint2.length - 1],
        type: 'Point'
      },
      properties: {},
      type: 'Feature'
    };
    map.current.on('load', () => {
      map.current.setLayoutProperty('bird', 'icon-rotate', calculateBearing(lineDataPoint[lineDataPoint.length - 2], lineDataPoint[lineDataPoint.length - 1]));
      map.current.getSource('last').setData(lastData);

      map.current.setLayoutProperty('bird2', 'icon-rotate', calculateBearing(lineDataPoint2[lineDataPoint2.length - 2], lineDataPoint2[lineDataPoint2.length - 1]));
      map.current.getSource('last2').setData(lastData2);
    });
    map.current.boxZoom.enable(); // Enable `box zoom` interaction
    map.current.doubleClickZoom.enable(); // Enable `double click to zoom` interaction
    map.current.dragPan.enable(); // Enable `drag to pan` interaction
    map.current.keyboard.enable(); // Enable `keyboard rotate and zoom` interaction
    map.current.keyboard.disableRotation(); // Disable `keyboard pan/rotate` interaction
    map.current.scrollZoom.enable(); // Enable `scroll to zoom` interaction
    map.current.touchPitch.enable();
    map.current.touchZoomRotate.enable(); // Enable `pinch to rotate and zoom` interaction
    map.current.touchZoomRotate.disableRotation(); // Disable `pinch to rotate` interaction
  }, [cleanFlightData, data]);

  useEffect(() => {
    if (update === true) {
      if (map.current) map.current.resize();
    }
  }, [update]);

  useEffect(() => {
    if (data) {
      loadMap();
    }
  }, [data, loadMap]);

  const deltaDistance = 100;
  const easing = (t) => t * (2 - t);
  const panMap = (direction) => {
    if (direction === 'up') {
      map.current.panBy([0, -deltaDistance], {
        easing
      });
    } else if (direction === 'down') {
      map.current.panBy([0, deltaDistance], {
        easing
      });
    } else if (direction === 'left') {
      map.current.panBy([-deltaDistance, 0], {
        easing
      });
    } else if (direction === 'right') {
      map.current.panBy([deltaDistance, 0], {
        easing
      });
    }
  };

  return (
    <div className="map_wrapper" id="kartta">
      <div className="maps_container">
        <div className="odometer">
          {odometer}
          {' '}
          km
        </div>
        <div className="odometer odometer2">
          {odometer2}
          {' '}
          km
        </div>
        <div ref={mapContainer} className="main_map" />
        <div className="pan_controls">
          <button className="pan_up" type="button" onClick={() => panMap('up')} aria-label="Pan north"><div><img src={`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/icn/up-arrow.png`} alt="" /></div></button>
          <button className="pan_down" type="button" onClick={() => panMap('down')} aria-label="Pan south"><div><img src={`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/icn/down-arrow.png`} alt="" /></div></button>
          <button className="pan_left" type="button" onClick={() => panMap('left')} aria-label="Pan east"><div><img src={`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/icn/left-arrow.png`} alt="" /></div></button>
          <button className="pan_right" type="button" onClick={() => panMap('right')} aria-label="Pan west"><div><img src={`${(window.location.href.includes('yle')) ? 'https://lusi-dataviz.ylestatic.fi/2024-muuttolinnut/' : './'}assets/img/icn/right-arrow.png`} alt="" /></div></button>
        </div>
      </div>
      <p className="updated_info">
        Tiedot päivitetty:
        {' '}
        {`${(new Date(values[2].individuals[0].locations[values[2].individuals[0].locations.length - 1].timestamp)).getDate()}.${(new Date(values[2].individuals[0].locations[values[2].individuals[0].locations.length - 1].timestamp)).getMonth() + 1}.${(new Date(values[2].individuals[0].locations[values[2].individuals[0].locations.length - 1].timestamp)).getFullYear()}`}
      </p>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
}

Map.propTypes = {
  update: PropTypes.bool.isRequired,
  values: PropTypes.instanceOf(Array).isRequired,
};

export default Map;
