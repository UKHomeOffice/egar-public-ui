'use strict';

const date = require('hof-component-date');
const autocomplete = require('../../../mixins').autocomplete.mixin;
const textExpander = require('../../../mixins').textExpander;
const time = require('../../../mixins').time;
const regex = require('./utils').regex;
const icaoCodes = require('../../../assets/json/icao');
const iataCodes = require('../../../assets/json/iata');

module.exports = {
    'egar-departure-date': date('egar-departure-date', {
        mixin: 'input-date',
        validate: ['date']
    }),
    'egar-departure-time': time('egar-departure-time', {
        validate: ['regex']
    }),
    'egar-departure-icao': autocomplete('egar-departure-icao', {
        searchUri: 'icao',
        minSearchLength: 2,
        validate: [function isValidCode(value) {
            return icaoCodes.isValidCode(value);
        }]
    }),
    'egar-departure-no-icao': textExpander('egar-departure-no-icao', {
        options: [{
            value: 'egar-departure-location',
            toggle: 'egar-departure-location-group',
            child: 'partials/departure-location-group'
        }]
    }),
    'egar-departure-location': {
        disableRender: true,
        mixin: 'radio-group',
        legend: {
            className: 'visuallyhidden'
        },
        options: [{
            value: 'iata',
            toggle: 'egar-departure-iata',
            child: 'partials/iata'
        }, {
            value: 'lat-long',
            toggle: 'egar-departure-point',
            child: 'partials/departure-point'
        }]
    },
    'egar-departure-latitude': {
        disableRender: true,
        mixin: 'input-text',

        validate: ['regex', {
            type: 'regex',
            arguments: regex.latitude
        }],
        dependent: {
            field: 'egar-departure-location',
            value: 'lat-long'
        }
    },
    'egar-departure-longitude': {
        disableRender: true,
        mixin: 'input-text',
        validate: ['regex', {
            type: 'regex',
            arguments: regex.longitude
        }],
        dependent: {
            field: 'egar-departure-location',
            value: 'lat-long'
        }
    },
    'egar-departure-iata': autocomplete('egar-departure-iata', {
        disableRender: true,
        searchUri: 'iata',
        minSearchLength: 2,
        validate: [function isValidCode(value) {
            return iataCodes.isValidCode(value);
        }],
        dependent: {
            field: 'egar-departure-location',
            value: 'iata'
        }
    })
};
