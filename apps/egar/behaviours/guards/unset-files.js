'use strict';

/**
 * The UnsetFiles Guard
 */
module.exports = UnsetFilesGuard => class extends UnsetFilesGuard {

    /**
     * Creates a new UnsetFilesGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that does not need a supportingFiles set,
     * this guard unsets it from the session.
     *
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        req.sessionModel.unset('supportingFiles');
        next();
    }
};
