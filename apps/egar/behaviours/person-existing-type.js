'use strict';

const PersonService = require('../services').PersonService;
// const config = require('../../../config')();
// const _ = require('lodash');
// const url = require('url');
// const util = require('util');

/**
 * The FormController behaviours for the people table
 */
module.exports = ExistingPersonTypeController => class extends ExistingPersonTypeController {
    /**
     * Creates a new ExistingPersonTypeController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'PersonController';
        this.service = new PersonService();
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const personName = req.sessionModel.get('personName');
        let captain;

        this.service.getPeopleForGAR(req, garUuid)
            .then(people => {
                captain = people.captain;
                if (captain) {
                    req.form.options.fields['egar-person-existing-type'].options =
                        req.form.options.fields['egar-person-existing-type'].options.splice(1);
                }
                next(null, {name: personName});
            }).catch(err => {
                this.log.error(err);
                next(err, {});
            });

    }

    /**
     * Saves the form values
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     * */
    saveValues(req, res, next) {
        if (req.method === 'POST' && !req.body.skip) {
            const garUuid = req.sessionModel.get('garUuid');
            const personId = req.sessionModel.get('personUuid');

            this.service.postExistingPerson(req, garUuid, personId, req.form.values)
                .then(
                    res.redirect('/egar/people')
                )
                .catch(err => {
                    next(err);
                });
        } else {
            super.process(req, res, next);
        }

    }

};
