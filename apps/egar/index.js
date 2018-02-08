'use strict';

const GarGuard = require('./behaviours').Guards.GarGuard;
const PersonGuard = require('./behaviours').Guards.PersonGuard;
const UnsetPersonGuard = require('./behaviours').Guards.UnsetPersonGuard;
const CompleteGuard = require('./behaviours').Guards.CompleteGuard;
const UnsetErrorsGuard = require('./behaviours').Guards.UnsetErrorsGuard;
const UnsetFilesGuard = require('./behaviours').Guards.UnsetFilesGuard;

const AircraftController = require('./behaviours').AircraftController;
const HomeController = require('./behaviours').HomeController;
const LocationController = require('./behaviours').LocationController;
const AttributesController = require('./behaviours').AttributesController;
const PersonController = require('./behaviours').PersonController;
const PeopleController = require('./behaviours').PeopleController;
const SummaryController = require('./behaviours').SummaryController;
const GarController = require('./behaviours').GarController;
const EgarController = require('./behaviours').EgarController;
const SubmitController = require('./behaviours').SubmitController;
const CompleteController = require('./behaviours').CompleteController;
const FileUploadController = require('./behaviours').FileUploadController;
const SupportingFilesController = require('./behaviours').SupportingFilesController;
const BehaviourAggregator = require('./behaviours').Aggregator;

module.exports = {
    name: 'egar',
    baseUrl: '/egar',
    steps: {
        // Only required because HOF's session timeout page routes here by mistake
        '/egar': {
            behaviours: EgarController
        },
        '/home': {
            behaviours: BehaviourAggregator,
            subBehaviours: [UnsetErrorsGuard, UnsetPersonGuard, UnsetFilesGuard, HomeController],
            next: '/aircraft',
            backLink: '../welcome'
        },
        '/manage-gars': {
            behaviours: BehaviourAggregator,
            subBehaviours: [UnsetErrorsGuard, UnsetPersonGuard, UnsetFilesGuard, GarController],
            backLink: 'home',
            fields: [
                'egar-manage-gars-date-from',
                'egar-manage-gars-date-to'
            ],
            next: '/home'
        },
        '/aircraft': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, AircraftController],
            backLink: 'home',
            fields: [
                'egar-aircraft-registration',
                'egar-aircraft-type',
                'egar-aircraft-base',
                'egar-aircraft-taxes-paid'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/departure',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/departure': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, LocationController],
            backLink: 'aircraft',
            fields: [
                'egar-departure-date',
                'egar-departure-time',
                'egar-departure-icao',
                'egar-departure-no-icao',
                'egar-departure-location',
                'egar-departure-latitude',
                'egar-departure-longitude',
                'egar-departure-iata'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/arrival',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/arrival': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, LocationController],
            backLink: 'departure',
            fields: [
                'egar-arrival-date',
                'egar-arrival-time',
                'egar-arrival-icao',
                'egar-arrival-no-icao',
                'egar-arrival-location',
                'egar-arrival-latitude',
                'egar-arrival-longitude',
                'egar-arrival-iata'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/goods',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/goods': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, AttributesController],
            backLink: 'arrival',
            fields: [
                'egar-goods-declaration',
                'egar-goods-expander'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/people',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/people': {
            next: '/supporting-files',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, PeopleController],
            backLink: 'goods'
        },
        '/person-existing': {
            next: '/people'
        },
        '/person-type': {
            next: '/person-general',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonController],
            backLink: 'people',
            fields: [
                'egar-person-type'
            ],
            forks: [{
                target: '/captain-general',
                condition: {
                    field: 'egar-person-type',
                    value: 'captain'
                }
            },
            {
                target: '/crew-general',
                condition: {
                    field: 'egar-person-type',
                    value: 'crew'
                }
            },
            {
                target: '/passenger-general',
                condition: {
                    field: 'egar-person-type',
                    value: 'passenger'
                }
            }
            ]
        },
        '/captain-general': {
            next: '/captain-birth',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'person-type',
            fields: [
                'egar-person-given-name',
                'egar-person-family-name',
                'egar-person-gender',
                'egar-person-uk-address'
            ]
        },
        '/captain-birth': {
            next: '/captain-travel',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'captain-general',
            fields: [
                'egar-person-dob',
                'egar-person-birth-place',
                'egar-person-nationality-country'
            ]
        },
        '/captain-travel': {
            next: '/captain-responsible',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'captain-birth',
            fields: [
                'egar-person-travel-document-type',
                'egar-person-travel-document-number',
                'egar-person-travel-document-expiry',
                'egar-person-travel-document-country'
            ]
        },
        '/captain-responsible': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, AttributesController],
            backLink: 'captain-travel',
            fields: [
                'egar-person-responsible',
                'egar-person-responsible-name',
                'egar-person-responsible-number'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/people',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/crew-general': {
            next: '/crew-birth',
            backLink: 'person-type',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            fields: [
                'egar-person-given-name',
                'egar-person-family-name',
                'egar-person-gender',
                'egar-person-uk-address'
            ]
        },
        '/crew-birth': {
            next: '/crew-travel',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'crew-general',
            fields: [
                'egar-person-dob',
                'egar-person-birth-place',
                'egar-person-nationality-country'
            ]
        },
        '/crew-travel': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'crew-birth',
            fields: [
                'egar-person-travel-document-type',
                'egar-person-travel-document-number',
                'egar-person-travel-document-expiry',
                'egar-person-travel-document-country'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/people',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/passenger-general': {
            next: '/passenger-birth',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'person-type',
            fields: [
                'egar-person-given-name',
                'egar-person-family-name',
                'egar-person-gender',
                'egar-person-uk-address'
            ]
        },
        '/passenger-birth': {
            next: '/passenger-travel',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'passenger-general',
            fields: [
                'egar-person-dob',
                'egar-person-birth-place',
                'egar-person-nationality-country'
            ]
        },
        '/passenger-travel': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, PersonGuard, PersonController],
            backLink: 'passenger-birth',
            fields: [
                'egar-person-travel-document-type',
                'egar-person-travel-document-number',
                'egar-person-travel-document-expiry',
                'egar-person-travel-document-country'
            ],
            forks: [{
                target: '/summary',
                condition: function test(req) {
                    return req.sessionModel.get('summary');
                }
            },
            {
                target: '/people',
                condition: function test(req) {
                    return !req.sessionModel.get('summary');
                }
            }]
        },
        '/supporting-files': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, SupportingFilesController],
            next: '/summary',
            backLink: 'people',
            fields: [
                'egar-supporting-files-expander',
                'egar-supporting-files'
            ],
            forks: [{
                target: '/upload-files',
                condition: {
                    field: 'egar-supporting-files',
                    value: 'true'
                }
            }]
        },
        '/upload-files': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, FileUploadController],
            next: '/summary',
            backLink: 'supporting-files',
            fields: ['egar-supporting-files-upload']
        },
        '/summary': {
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetPersonGuard, SummaryController],
            backLinks: ['manage-gars'],
            next: '/submit'
        },
        '/submit': {
            next: '/complete',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard, SubmitController],
            backLink: 'summary'
        },
        '/complete': {
            template: 'confirmation',
            behaviours: BehaviourAggregator,
            subBehaviours: [GarGuard, UnsetErrorsGuard, UnsetPersonGuard,
                UnsetFilesGuard, CompleteGuard, CompleteController]
        }
    }
};
