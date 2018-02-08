'use strict';
const LocationService = require('../services').LocationService;
const Location = require('../services').Location;
const moment = require('moment');
const _ = require('lodash');

/**
 * The FormController behaviours for the departure and arrival forms
 */
module.exports = LocationController => class extends LocationController {

    /**
     * Creates a new LocationController instance
     * @param {Object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'LocationController';
        this.service = new LocationService();
    }

    /**
     * Gets the page key used to identify fields based on the URL used to access the form
     * @param {http.IncomingMessage} req The GET/POST request
     */
    getPageKey(req) {
        return req.url.indexOf('departure') > 0 ? Location.DEPARTURE : Location.ARRIVAL;
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const location = this.getPageKey(req);

        if (Object.keys(req.form.errors).length > 0) {
            const formValues = req.sessionModel.get(`${this.getPageKey(req)}-form`);
            req.sessionModel.unset(`${this.getPageKey(req)}-form`);

            next(null, formValues);
        } else {
            const garUuid = req.sessionModel.get('garUuid');
            this.service.getLocationDetails(req, garUuid, location)
                .then(locationDetails => {
                    req.sessionModel.unset('errorValues');
                    next(null, locationDetails);
                }).catch(err => {
                    // console.log(err);
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
        this.service.postLocationDetails(req, garUuid, this.getPageKey(req), req.body, req.form.values)
            .then(() => {
                next();
            })
            .catch(err => {
                next(err);
            });
    }

    /**
     * Processes the form values before they are validated
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    process(req, res, next) {
        if (req.form) {
            const location = this.getPageKey(req);
            const formValues = req.body;

            if (Object.keys(formValues).indexOf(`egar-${location}-icao-autocomplete`) >= 0) {
                formValues[`egar-${location}-icao`] = formValues[`egar-${location}-icao-autocomplete`];
                req.form.values[`egar-${location}-icao`] = formValues[`egar-${location}-icao-autocomplete`];
            }
            if (Object.keys(formValues).indexOf(`egar-${location}-iata-autocomplete`) >= 0) {
                formValues[`egar-${location}-iata`] = formValues[`egar-${location}-iata-autocomplete`];
                req.form.values[`egar-${location}-iata`] = formValues[`egar-${location}-iata-autocomplete`];
            }

            req.sessionModel.set(`${this.getPageKey(req)}-form`, formValues);
        }
        next();
    }

    /**
    * Processes the form values before they are used
    * @param {http.IncomingMessage} req
    * @param {http.ServerResponse} res
    * @param {Function} next The function to call to continue the pipeline
    */
    configure(req, res, next) {
        if (req.form) {
            const location = this.getPageKey(req);
            const formValues = req.body;

            formValues[`egar-${location}-date-day`] = _.trim(formValues[`egar-${location}-date-day`]);
            formValues[`egar-${location}-date-month`] = _.trim(formValues[`egar-${location}-date-month`]);
            formValues[`egar-${location}-date-year`] = _.trim(formValues[`egar-${location}-date-year`]);
        }
        next();
    }

    /* eslint-disable complexity*/
    /**
     * Checks that the date/time is in the future.
     *
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    validate(req, res, next) {
        const page = this.getPageKey(req);
        const date = req.form.values[`egar-${page}-date`];
        const time = req.form.values[`egar-${page}-time`];

        const icao = req.form.values[`egar-${page}-icao`];
        const iata = req.form.values[`egar-${page}-iata`];
        const point = req.form.values[`egar-${page}-latitude`] || req.form.values[`egar-${page}-longitude`];

        const errors = {};
        if (moment(`${date}T${time}Z`).isBefore(moment.utc()) || (moment(date).isBefore(moment.utc()) && !time)) {
            errors[`egar-${page}-date`] =
                new this.ValidationError(`egar-${page}-date`, { type: 'validateDate', arguments: [] });
            errors[`egar-${page}-time`] =
                new this.ValidationError(`egar-${page}-time`, { type: 'validateTime', arguments: [] });
        }
        if (((icao && iata) || (icao && point) || (iata && point)) && icao !== 'ZZZZ') {
            if (icao) {
                errors[`egar-${page}-icao`] =
                    new this.ValidationError(`egar-${page}-icao`, { type: 'validateLocation', arguments: [] });
            }
            if (iata) {
                errors[`egar-${page}-iata`] =
                    new this.ValidationError(`egar-${page}-iata`, { type: 'validateLocation', arguments: [] });
            }
            if (point) {
                errors[`egar-${page}-latitude`] =
                    new this.ValidationError(`egar-${page}-latitude`, { type: 'validateLocation', arguments: [] });

                errors[`egar-${page}-longitude`] =
                    new this.ValidationError(`egar-${page}-longitude`, { type: 'validateLocation', arguments: [] });
            }
        }

        if (icao === 'ZZZZ' && _.isEmpty(iata) && _.isEmpty(point)) {
            errors[`egar-${page}-icao`] =
            new this.ValidationError(`egar-${page}-icao`, { type: 'validateIcao', arguments: [] });
        }
        next(_.isEmpty(errors) ? null : errors);
    }
    /* eslint-enable complexity*/

};
