'use strict';
const PersonService = require('../services').PersonService;
const _ = require('lodash');

/**
 * The FormController behaviours for the person forms
 */
module.exports = PersonController => class extends PersonController {

    /**
     * Creates a new PersonController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'PersonController';
        this.service = new PersonService();
    }

    /**
    * Processes the form values before they are used
    * @param {http.IncomingMessage} req
    * @param {http.ServerResponse} res
    * @param {Function} next The function to call to continue the pipeline
    */
    configure(req, res, next) {
        if (req.form) {
            const formValues = req.body;

            formValues['egar-person-dob-day'] = _.trim(formValues['egar-person-dob-day']);
            formValues['egar-person-dob-month'] = _.trim(formValues['egar-person-dob-month']);
            formValues['egar-person-dob-year'] = _.trim(formValues['egar-person-dob-year']);

            formValues['egar-person-travel-document-expiry-day'] =
            _.trim(formValues['egar-person-travel-document-expiry-day']);
            formValues['egar-person-travel-document-expiry-month'] =
            _.trim(formValues['egar-person-travel-document-expiry-month']);
            formValues['egar-person-travel-document-expiry-year'] =
            _.trim(formValues['egar-person-travel-document-expiry-year']);
        }
        next();
    }

    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const personId = req.sessionModel.get('personId');
        let captain;

        if (req.url.includes('person-type')) {
            this.service.getPeople(req, garUuid)
                .then(people => {
                    captain = people.captain;
                    if (!personId) {
                        if (captain) {
                            req.form.options.fields['egar-person-type'].options =
                                req.form.options.fields['egar-person-type'].options.splice(1);
                        }
                        next(null, people);
                    }
                }).catch(err => {
                    // console.log(err);
                    next(err, {});
                });
        }

        if (personId) {
            this.service.getPerson(req, garUuid, personId)
                .then(person => {
                    req.sessionModel.set('person', person);
                    if (captain && person['egar-person-type'] !== 'captain') {
                        req.form.options.fields['egar-person-type'].options =
                            req.form.options.fields['egar-person-type'].options.splice(1);
                    }
                    next(null, person);
                }).catch(err => {
                    next(err, {});
                });
        }
    }

    /**
     * Saves the form values
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    saveValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const personId = req.sessionModel.get('personId');
        const person = req.sessionModel.get('person');

        if (personId) {
            this.service.updatePerson(req, garUuid, req.form.values, personId, person)
                .then(() => next())
                .catch(err => {
                    next(err);
                });
        } else {
            this.service.postPerson(req, garUuid, req.form.values)
                .then(response => {
                    if (!personId) {
                        req.sessionModel.set('personId', response.person_uuid);
                    }
                })
                .then(next)
                .catch(err => {
                    next(err);
                });
        }
    }
};
