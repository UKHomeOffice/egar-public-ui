'use strict';

/**
 * The GAR Guard
 */
module.exports = GarGuard => class extends GarGuard {

    /**
     * Creates a new GarGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that needs
     * a garUuid without a garUuid we redirect the user
     * to the previous page (if it was an eGAR page)
     * or the Manage GARs page if not.
     * The latter behaviour allows the user to select
     * the GAR they were trying to view/edit.
     *
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        if (!req.sessionModel.get('garUuid') && !res.headersSent) {
            res.redirect('/egar/manage-gars');

        } else {
            next();
        }
    }
};
