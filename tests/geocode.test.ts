import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGeolocationNotice,
  formatPhotonFeature,
  parseCoordinateInput,
} from '../src/lib/geocode';
import { toResilientEsriUrl } from '../src/config/mapLayers';

test('parseCoordinateInput parses decimal comma and space pairs', () => {
  assert.deepEqual(parseCoordinateInput('-3.10, -60.00'), {
    status: 'valid',
    lat: -3.1,
    lon: -60,
  });
  assert.deepEqual(parseCoordinateInput('78.2 15.6'), {
    status: 'valid',
    lat: 78.2,
    lon: 15.6,
  });
});

test('parseCoordinateInput parses degree symbols and N/S/E/W compass labels', () => {
  assert.deepEqual(parseCoordinateInput('3.10°S, 60.00°W'), {
    status: 'valid',
    lat: -3.1,
    lon: -60,
  });
  assert.deepEqual(parseCoordinateInput('60.00° W, 3.10° S'), {
    status: 'valid',
    lat: -3.1,
    lon: -60,
  });
});

test('parseCoordinateInput rejects out-of-range coordinates honestly', () => {
  const res = parseCoordinateInput('95.5, 10.0');
  assert.equal(res.status, 'invalid');
});

test('parseCoordinateInput routes place names to geocoding', () => {
  assert.deepEqual(parseCoordinateInput('Manaus, Brazil'), { status: 'not_coords' });
  assert.deepEqual(parseCoordinateInput('Route 66'), { status: 'not_coords' });
});

test('formatPhotonFeature formats clean label and deduplicated subtitle', () => {
  const formatted = formatPhotonFeature(
    {
      geometry: { coordinates: [-60.0217, -3.119] },
      properties: {
        osm_type: 'R',
        osm_id: 332493,
        name: 'Manaus',
        city: 'Manaus',
        state: 'Amazonas',
        country: 'Brazil',
      },
    },
    0
  );
  assert.deepEqual(formatted, {
    id: 'R-332493',
    label: 'Manaus',
    subtitle: 'Amazonas, Brazil',
    lat: -3.12,
    lon: -60.02,
  });
});

test('formatGeolocationNotice flags coarse IP-level accuracy (>1km) honestly', () => {
  const coarse = formatGeolocationNotice(31.58, 74.33, 12400);
  assert.equal(coarse.isCoarse, true);
  assert.match(coarse.text, /Approximate browser location/);
  assert.match(coarse.text, /±12 km/);

  const precise = formatGeolocationNotice(31.52, 74.35, 35);
  assert.equal(precise.isCoarse, false);
  assert.match(precise.text, /Located at 31\.52°, 74\.35° \(±35 m\)/);
});

test('toResilientEsriUrl maps ArcGIS https URLs to custom esri-retry protocol', () => {
  assert.equal(
    toResilientEsriUrl(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ),
    'esri-retry://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  );
});
