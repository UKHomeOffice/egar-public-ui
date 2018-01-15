'use strict';

/**
 * The Person Guard
 */
module.exports = PersonGuard => class extends PersonGuard {

    /**
     * Creates a new PersonGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that needs
     * a personId without a personId being set we redirect the user
     * to the people page to allow them to choose the user to view/edit.
     *
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        if (!req.sessionModel.get('personId')) {
            res.redirect('/egar/people');
        } else {
            next();
        }
    }
};
