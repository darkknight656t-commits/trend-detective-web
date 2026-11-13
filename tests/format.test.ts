import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDecadalRate,
  formatPValue,
  formatRateDifference,
  normalizeLongitude,
  roundCoord,
} from '../src/lib/format';

test('formatRateDifference subtracts the two displayed 2-decimal rates', () => {
  // 0.276 displays as +0.28, 0.794 displays as +0.79 -> 0.28 - 0.79 = -0.51 (not -0.52)
  assert.equal(formatRateDifference(0.794, 0.276, '°C'), '-0.51 °C/decade');
  assert.equal(formatRateDifference(0.0, -0.349, 'mm/day'), '-0.35 mm/day/decade');
  assert.equal(formatRateDifference(null, 0.28, '°C'), 'N/A');
});

test('formatDecadalRate formats signed 2-decimal rate and unit', () => {
  assert.equal(formatDecadalRate(0.28, '°C'), '+0.28 °C / decade');
  assert.equal(formatDecadalRate(-0.349, 'mm/day'), '-0.35 mm/day / decade');
});

test('formatPValue formats below-threshold and exact values', () => {
  assert.equal(formatPValue(0.0002), 'p < 0.001');
  assert.equal(formatPValue(0.0081), 'p = 0.008');
  assert.equal(formatPValue(undefined), 'N/A');
});

test('normalizeLongitude and roundCoord keep coordinates bounded and 2-decimal rounded', () => {
  assert.equal(normalizeLongitude(190), -170);
  assert.equal(normalizeLongitude(-190), 170);
  assert.equal(roundCoord(-3.146), -3.15);
});
