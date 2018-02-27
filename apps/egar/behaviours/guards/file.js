'use strict';

/**
 * The File Guard
 */
module.exports = FileGuard => class extends FileGuard {

    /**
     * Creates a new FileGuard instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * When the user navigates to a page that needs
     * an uploaded-file without an uploaded-file being set we redirect the user
     * to the upload-files page to allow them to upload a new file.
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    configure(req, res, next) {
        if (!req.sessionModel.get('uploadFile') && !res.headersSent) {
            res.redirect('/egar/upload-files');
        } else {
            next();
        }
    }
};
