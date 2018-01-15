'use strict';

const date = require('hof-component-date');
const autocomplete = require('../../../mixins').autocomplete.mixin;
const textExpander = require('../../../mixins').textExpander;
const time = require('../../../mixins').time;
const regex = require('./utils').regex;
const icaoCodes = require('../../../assets/json/icao');
const iataCodes = require('../../../assets/json/iata');

module.exports = {
    'egar-arrival-date': date('egar-arrival-date', {
        mixin: 'input-date',
        validate: ['date']
    }),
    'egar-arrival-time': time('egar-arrival-time', {
        validate: ['regex']
    }),
    'egar-arrival-icao': autocomplete('egar-arrival-icao', {
        searchUri: 'icao',
        minSearchLength: 2,
        validate: [function isValidCode(value) {
            return icaoCodes.isValidCode(value);
        }]
    }),
    'egar-arrival-no-icao': textExpander('egar-arrival-no-icao', {
        options: [{
            value: 'egar-arrival-location',
            toggle: 'egar-arrival-location-group',
            child: 'partials/arrival-location-group'
        }]
    }),
    'egar-arrival-location': {
        disableRender: true,
        mixin: 'radio-group',
        legend: {
            className: 'visuallyhidden'
        },
        options: [{
            value: 'iata',
            toggle: 'egar-arrival-iata',
            child: 'partials/iata'
        }, {
            value: 'lat-long',
            toggle: 'egar-arrival-point',
            child: 'partials/arrival-point'
        }]
    },
    'egar-arrival-latitude': {
        disableRender: true,
        mixin: 'input-text',
        validate: ['regex', {
            type: 'regex',
            arguments: regex.latitude
        }],
        dependent: {
            field: 'egar-arrival-location',
            value: 'lat-long'
        }
    },
    'egar-arrival-longitude': {
        disableRender: true,
        mixin: 'input-text',
        validate: ['regex', {
            type: 'regex',
            arguments: regex.longitude
        }],
        dependent: {
            field: 'egar-arrival-location',
            value: 'lat-long'
        }
    },
    'egar-arrival-iata': autocomplete('egar-arrival-iata', {
        disableRender: true,
        searchUri: 'iata',
        minSearchLength: 2,
        validate: [function isValidCode(value) {
            return iataCodes.isValidCode(value);
        }],
        dependent: {
            field: 'egar-arrival-location',
            value: 'iata'
        }
    })
};
