'use strict';

/**
 * The FormController behaviours for /egar/egar.
 */
module.exports = EgarController => class extends EgarController {

    /**
     * Creates a new EgarController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'EgarController';
    }

    /**
     * Redirects the user to the Welcome page when the session has ended or the page is not found
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    configure(req, res) {
        if (req.session.firstEgarUrl) {
            const redirectUrl = req.session.firstEgarUrl;
            delete req.session.firstEgarUrl;
            res.redirect(303, redirectUrl);
        } else {
            // Use code 301 as this is a permanent redirect
            res.redirect(301, '/welcome');
        }
    }
};
