'use strict';
const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');

const config = require('../../../config')();
const FileService = require('../services').FileService;

const log = config.logger;
const storageType = config['file-upload-storage-type'];

let s3;

if (storageType === 's3') {
    aws.config.update(config['file-upload-aws-config']);
    s3 = new aws.S3();
}

/**
 * The FormController behaviours for the 'Is this file correct' form
 */
module.exports = FileUploadOkController => class extends FileUploadOkController {

    /**
     * Creates a new FileUploadOkController instance
     * @param {Object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'FileUploadOkController';
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
        const file = req.sessionModel.get('uploadFile');
        const filename = file.filename || file.originalname;

        this.service.getFileDetails(req, garUuid)
            .then(files => {
                let possibleDuplicate = false;

                if (files.hasFiles) {
                    possibleDuplicate = _.some(files.files, f => f.file.file_name === filename);
                }

                next(null, {
                    filename: filename,
                    possibleDuplicate: possibleDuplicate,
                    duplicateWarning: req.translate('errors.duplicate-file-warning')
                });
            }).catch(err => {
                next(err, {});
            });
    }

    /**
    * Saves the form values
    * @param {http.IncomingMessage} req The POST request
    * @param {http.ServerResponse} res The response that will be sent to the browser
    * @param {Function} next The function to call to continue the pipeline
    */
    saveValues(req, res, next) {
        const file = req.sessionModel.get('uploadFile');
        const garUuid = req.sessionModel.get('garUuid');

        if (req.form.values['egar-file-ok'] === 'true') {
            req.sessionModel.set('supportingFiles', true);
            const values = {
                uri: file.location || file.path,
                garUuid: garUuid
            };

            this.service.postFileDetails(req, values)
                .then(() => {
                    next();
                })
                .catch(err => {
                    let error = req.translate('errors.file-upload-error');
                    if (err.statusCode === 403 && err.error && err.error.message === 'Only allowed to upload 5 files') {
                        error = req.translate('errors.max-files');
                    }

                    this.log.error(err);
                    req.sessionModel.set('fileUploadError', error);
                    next();
                });
        } else {
            this.deleteUploadedFile(file);
            next();
        }
    }

    /**
     * Deletes an unwanted uploaded file
     * @param {Object} file An object that describes the uploaded file
     */
    deleteUploadedFile(file) {
        const logErr = err => {
            if (err) {
                log.error(`Unable to delete uploaded file ${file}: ${err}`);
            }
        };

        if (storageType === 's3') {
            const params = {
                Bucket: file.bucket,
                Key: file.key
            };

            s3.deleteObject(params, logErr);
        } else {
            fs.unlink(file.path, logErr);
        }
    }

    locals(req, res) {
        let locals = Object.assign({}, super.locals(req, res));

        locals.buttons = [];

        locals.buttons.push({
            id: 'continueOnly',
            name: 'continueOnly',
            value: req.translate('buttons.continueOnly')
        });
        return locals;
    }
};
