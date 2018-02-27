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
            this.service.getPeopleForGAR(req, garUuid)
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
                    let formValues = this.addPersonDetailsToForm(req, person);
                    req.sessionModel.set('person', formValues);
                    if (captain && person.type !== 'captain') {
                        req.form.options.fields['egar-person-type'].options =
                            req.form.options.fields['egar-person-type'].options.splice(1);
                    }
                    next(null, formValues);
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

    /**
     * Maps a person to the form field values, filtering out any falsy properties
     * @param {http.IncomingMessage} req The incoming request
     * @param {Object} person An Object containing person details
     * @returns {Object} A map of form fields vs values
     */
    addPersonDetailsToForm(req, person) {
        let formValues = {};
        formValues['egar-person-type'] = person.type;
        formValues['egar-person-given-name'] = person.details.given_name;
        formValues['egar-person-family-name'] = person.details.family_name;
        formValues['egar-person-gender'] = _.lowerCase(person.details.gender);
        formValues['egar-person-uk-address'] = person.details.address;
        formValues['egar-person-dob'] = person.details.dob;
        formValues['egar-person-birth-place'] = person.details.place;
        formValues['egar-person-nationality-country'] = person.details.nationality;
        formValues['egar-person-travel-document-type'] = person.details.document_type;
        formValues['egar-person-travel-document-number'] = person.details.document_no;
        formValues['egar-person-travel-document-expiry'] = person.details.document_expiryDate;
        formValues['egar-person-travel-document-country'] = person.details.document_issuingCountry;

        formValues = _.pickBy(formValues, value => !!value);

        return formValues;
    }
};
