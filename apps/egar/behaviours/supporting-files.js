'use strict';

/**
 * The FormController behaviours for the supporting files page
 */
module.exports = SupportingFilesController => class extends SupportingFilesController {

    /**
     * Creates a new SupportingFilesController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
    }

     /**
     * Gets the form values
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    getValues(req, res, next) {
        const supportingFiles = req.sessionModel.get('supportingFiles');
        next(null, {'egar-supporting-files': supportingFiles});
    }

    /**
     * Saves the form values
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call to continue the pipeline
     */
    saveValues(req, res, next) {
        req.sessionModel.set('supportingFiles', req.form.values['egar-supporting-files']);
        next();
    }

};
