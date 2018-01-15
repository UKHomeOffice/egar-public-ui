'use strict';

/**
 * The UnsetPerson Guard
 */
module.exports = UnsetPersonGuard => class extends UnsetPersonGuard {

    /**
     * Creates a new UnsetPersonGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that does not need a personId set,
     * this guard unsets it from the session.
     *
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        req.sessionModel.unset('personId');
        next();
    }
};
