'use strict';
const _ = require('lodash');

const FileService = require('../services').FileService;

/**
 * The FormController behaviours for the file upload forms
 */
module.exports = FileUploadController => class extends FileUploadController {

    /**
     * Creates a new FileUploadController instance
     * @param {Object} options
     */
    constructor(options) {
        super(options);
        this.service = new FileService();
        this.useDefaultButtons = false;
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        var data = {
            error: req.sessionModel.get('fileUploadError')
        };

        this.service.getFileDetails(req, garUuid)
            .then(files => {
                if (files.hasFiles) {
                    files.files = files.files.map((element, index) => {
                        element.count = index + 1;
                        return element;
                    });
                }

                /* eslint-disable camelcase*/
                _.forEach(files.files, file => {
                    file.file.file_status = req.translate(`file-states.${file.file.file_status}`);
                });
                /* eslint-enable camelcase*/

                data.files = files.files;
                next(null, data);
            }).catch(err => {
                next(err, {});
            }
            );
    }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        let locals = Object.assign({}, super.locals(req, res));
        const data = req.form.values || {};

        locals.buttons = [];

        locals.buttons.push({
            id: 'upload-file',
            name: 'upload-file',
            value: req.translate('buttons.upload-file')
        });

        if (!data.files || data.files.length === 0) {
            locals.buttons.push({
                id: 'skip',
                name: 'skip',
                value: req.translate('buttons.skip')
            });
        } else {
            locals.continueButton = {
                id: 'continue',
                name: 'continue',
                value: req.translate('buttons.continue')
            };
        }

        return locals;
    }

    /**
     * Processes button clicks on the form
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    process(req, res, next) {
        if (req.body.delete) {
            let fileToDelete = req.body.delete;
            fileToDelete = fileToDelete.split(':');
            const fileID = fileToDelete[1];
            const garUuid = req.sessionModel.get('garUuid');

            req.form.options.next = req.form.options.route;

            this.service.deleteFile(req, garUuid, fileID)
                .then(() => {
                    // Redirect to the upload files form
                    req.form.options.next = req.form.options.route;
                    next();
                }
                );
        } else {
            if (req.body['upload-file']) {
                req.form.options.next = req.form.options.route;
            }

            next();
        }
    }

    /**
    * Saves the form values
    * @param {http.IncomingMessage} req The POST request
    * @param {http.ServerResponse} res The response that will be sent to the browser
    * @param {Function} next The function to call to continue the pipeline
    */
    saveValues(req, res, next) {
        if (req.file && req.body['upload-file']) {
            req.sessionModel.set('supportingFiles', true);
            const values = {
                uri: req.file.location || req.file.path,
                garUuid: req.sessionModel.attributes.garUuid
            };
            this.service.postFileDetails(req, values)
                .then((response) => {
                    if (response.statusCode === 403) {
                        const error = {
                            reason: req.translate('errors.file-upload-error')
                        };
                        req.sessionModel.set('fileUploadError', error);
                    } else {
                        req.sessionModel.set('fileUploadError', '');
                    }
                    next();
                })
                .catch(err => {
                    this.log.error(err);
                    next(err);
                });
        } else {
            next();
        }
    }
};
