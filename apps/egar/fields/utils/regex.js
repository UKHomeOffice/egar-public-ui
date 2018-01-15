'use strict';

// Lat/Long prefixes
const eastOrWest = '[EW]';
const northOrSouth = '[NS]';
const plusOrMinus = '[\+-]';
const whiteSpace = '\s*';

/* eslint-disable*/
// Max degree + minute latitude = 90 degrees, 00 minutes,
const _9000 = '9000';
const _0000To8959 = '[0-8][0-9][0-5][0-9]';

// Max decimal latitude = 90.00
const _90p00 = '90\\.00';
const _00p00To89p99 = '[0-8][0-9]\\.[0-9]{2}';

const validDegreeLat = `(${northOrSouth}(${_0000To8959}|${_9000}))`;
const validDecimalLat = `(${plusOrMinus}?(${_00p00To89p99}|${_90p00}))`;

/**
 * Matches latitudes of:
 * N/S 0000-8959 or 9000 in DDMM (degree minute) format or
 * +-00.00 to +- 90.00 in decimal format
 * Also matches an empty string to allow draft completion
 */
const validLat = `^(${validDegreeLat}|${validDecimalLat}|${whiteSpace})$`;


// Max degree + minute longitude = 180 degrees, 00 minutes
const _18000 = '18000';
const _10000To17959 = '1[0-7][0-9][0-5][0-9]';
const _0000To9959 = '0?[0-9]{2}[0-5][0-9]';

// Max decimal = 180.00
const _180p00 = '180\\.00';
const _00p00To99p99 = '0?[0-9]{2}\\.[0-9]{2}';
const _100p00To179p99 = '1[0-7][0-9]\\.[0-9][0-9]';

const validDegreeLong = `(${eastOrWest}(${_0000To9959}|${_10000To17959}|${_18000}))`;
const validDecimalLong = `(${plusOrMinus}?(${_00p00To99p99}|${_100p00To179p99}|${_180p00}))`;

/**
 * Matches longitudes of:
 * E/W 0000-17959 or 18000 in DDDMM (degree minute) format or
 * +-00.00 to +- 180.00 in decimal format
 * Also matches an empty string to allow draft completion
 */
const validLong = `^(${validDegreeLong}|${validDecimalLong}|${whiteSpace})$`;


module.exports = {
    latitude: new RegExp(validLat),
    longitude: new RegExp(validLong)
}
