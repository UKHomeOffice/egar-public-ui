'use strict';
const AircraftService = require('../services').AircraftService;

module.exports = AircraftController => class extends AircraftController {

    /**
     * Creates a new AircraftController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'AircraftController';
        this.service = new AircraftService();
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        this.service.getAircraftDetails(req, garUuid)
            .then(aircraftDetails => {
                next(null, aircraftDetails);
            }).catch(err => {
                next(err, {});
            });
    }

    /**
     * Saves the form values
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    saveValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        this.service.postAircraftDetails(req, garUuid, req.form.values)
            .then(() => {
                next();
            })
            .catch(err => {
                next(err);
            });
    }

};
