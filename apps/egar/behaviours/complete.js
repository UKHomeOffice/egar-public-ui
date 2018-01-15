'use strict';
const SubmitService = require('../services').SubmitService;

/**
 * The FormController behaviours for the confirmation page
 */
module.exports = CompleteController => class extends CompleteController {

    /**
     * Creates a new CompleteController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'CompleteController';
        this.service = new SubmitService();
    }

    /**
     * Gets values
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        this.service.getSubmissionResult(req, garUuid)
        .then(submission => {
            next(null, submission);
        }).catch(err => {
            next(err, {});
        });
    }

};
