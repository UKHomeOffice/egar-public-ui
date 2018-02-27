'use strict';

const date = require('hof-component-date');
const _ = require('lodash');
const autocomplete = require('../../../mixins').autocomplete.mixin;
const moment = require('moment');
const config = require('../../../config')();

/* eslint-disable  implicit-dependencies/no-implicit */
const countriesList = require('country-list')().getData();
let countries = [{ label: '', value: '' }];
_.forEach(countriesList, country => {
    countries.push({ label: country.name, value: country.code });
});

module.exports = {
    'egar-person-type': {
        mixin: 'radio-group',
        legend: {
            className: 'visuallyhidden'
        },
        options: ['captain', 'crew', 'passenger'],
        validate: 'required'
    },
    'egar-person-existing-type': {
        mixin: 'radio-group',
        legend: {
            className: 'visuallyhidden'
        },
        options: ['captain', 'crew', 'passenger']
    },
    'egar-person-given-name': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-person-family-name': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-person-gender': {
        mixin: 'radio-group',
        options: ['female', 'male', 'unspecified']
    },
    'egar-person-uk-address': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-person-dob': date('egar-person-dob', {
        mixin: 'input-date',
        validate: ['date', function validateDate(value) {
            return value === '' || (moment(value).isBetween(moment([1900, 1, 1]), moment.utc()));
        }]
    }),
    'egar-person-birth-place': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-person-nationality-country': autocomplete('egar-person-nationality-country', {
        fallback: 'select',
        options: countries,
        showAllValues: true
    }),
    'egar-person-travel-document-type': {
        mixin: 'radio-group',
        options: ['passport', 'idcard', 'unspecified']
    },
    'egar-person-travel-document-number': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 44 }]
    },
    'egar-person-travel-document-expiry': date('egar-person-travel-document-expiry', {
        mixin: 'input-date',
        validate: ['date', function validateDate(value) {
            return value === '' || moment(value).isAfter(
                moment.utc().add(config['travel-doc-expiry-date-value'],
                config['travel-doc-expiry-date-type']));
        }],
    }),
    'egar-person-travel-document-country': autocomplete('egar-person-travel-document-country', {
        fallback: 'select',
        options: countries,
        showAllValues: true
    }),
    'egar-person-responsible': {
        mixin: 'radio-group',
        legend: {
            className: 'visuallyhidden'
        },
        options: [
            { value: 'captain' },
            {
                value: 'other',
                toggle: [
                    { name: 'egar-person-responsible-name' },
                    { name: 'egar-person-responsible-number' }],
                child: 'partials/responsible-person'
            }
        ]
    },
    'egar-person-responsible-name': {
        disableRender: true,
        mixin: 'input-text',
        dependent: {
            field: 'egar-person-responsible',
            value: 'other'
        },
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-person-responsible-number': {
        disableRender: true,
        mixin: 'input-text',
        dependent: {
            field: 'egar-person-responsible',
            value: 'other'
        },
        validate: [{type: 'maxlength', arguments: 35 }]
    }
};
