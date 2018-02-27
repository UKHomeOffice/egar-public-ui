'use strict';

/**
 * The UnsetErrors Guard
 */
module.exports = UnsetErrorsGuard => class extends UnsetErrorsGuard {

    /**
     * Creates a new UnsetErrorsGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that does set or show errors
     * this guard unsets it from the session.
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        req.sessionModel.unset('garErrors');
        next();
    }
};
