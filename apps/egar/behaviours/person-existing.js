'use strict';

const _ = require('lodash');
const querystring = require('querystring');

const PersonService = require('../services').PersonService;
const config = require('../../../config')();
const paging = require('./utils').paging;

/**
 * The FormController behaviours for the people table
 */
module.exports = ExistingPeopleController => class extends ExistingPeopleController {
    /**
     * Creates a new ExistingPeopleController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'ExistingPeopleController';
        this.service = new PersonService();
        this.PAGE_LENGTH = config['people-page-length'];
        this.useDefaultButtons = false;
    }

    /**
     * Processes button clicks on the form
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    process(req, res, next) {

        if (req.method === 'POST' && !req.body.cancel) {

            let buttonData = _.find(Object.keys(req.body),
                k => ((k.indexOf('delete:') === 0) ||
                    (k.indexOf('edit:') === 0) ||
                    (k.indexOf('add:') === 0))
            ) || '';

            buttonData = buttonData.split(':');
            const task = buttonData[0];
            const personID = buttonData[1];
            const personName = buttonData[2];

            switch (task) {

                case 'add':
                    req.sessionModel.set('personUuid', personID);
                    req.sessionModel.set('personName', personName);
                    req.form.options.next = '/person-existing-type';
                    break;

                case 'delete':
                    // TO DO: delete person entirely from users account
                    break;

                case 'edit':
                    // TO DO: how to edit person record when we don't know what edit page to send them to
                    // could be captain, crew or passenger
                    break;

                default:
                    req.form.options.next = `/person-existing?q=${querystring.escape(req.body.searchTerm)}`;
                    break;
            }
        }
        super.process(req, res, next);
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        let currentPage = paging.getCurrentPage(req);
        let numPeople = 0;
        const searchTerm = req.query.q;
        this.service.searchPeople(req, searchTerm)
            .then(personUuids => {
                numPeople = personUuids.length;
                personUuids = paging.getUUIDSForCurrentPage(personUuids, currentPage, this.PAGE_LENGTH);
                this.service.getPeople(req, personUuids)
                    .then(peopleDetails => {
                        peopleDetails.forEach(this.service.formatPerson);

                        const pagingData = paging.getPagingData(numPeople, currentPage, this.PAGE_LENGTH, req);
                        return {
                            searchTerm: searchTerm,
                            people: peopleDetails,
                            paging: pagingData
                        };
                    })
                    .then(peopleData => {
                        next(null, peopleData);
                    })
                    .catch(err => {
                        next(err, {});
                    });
            });
    }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        const locals = super.locals(req, res);

        locals.buttons = [{
            id: 'cancel',
            name: 'cancel',
            value: req.translate('buttons.cancel')
        }];

        return locals;
    }
};
