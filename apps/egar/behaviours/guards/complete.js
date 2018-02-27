'use strict';

/**
 * The Complete Guard
 */
module.exports = CompleteGuard => class extends CompleteGuard {

    /**
     * Creates a new CompleteGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * Only allow the user to navigate to the complete page when
     * there is a GAR_UUID, the user has come from the submit page
     * and there are no errors returned from the summary.
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const referer = req.get('referer');
        if (garUuid && referer && referer.includes('submit') && !req.sessionModel.get(garUuid) && !res.headersSent) {
                next();
        } else if (!res.headersSent) {
            res.redirect('/egar/manage-gars');
        }
    }
};
