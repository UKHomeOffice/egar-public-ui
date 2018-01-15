'use strict';

const _ = require('lodash');
const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');

/**
 * The Service for the Supporting Files form
 */
class FileService {

    /**
     * Creates a new FileService instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.FILES_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/files/`;
        };

        this.FILE_ENDPOINT_GENERATOR = (garUuid, fileId) => {
            return `${baseUrl}/WF/GARs/${garUuid}/files/${fileId}/`;
        };
    }

    /**
     * Gets the API endpoint for file details
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getFilesUrl(garUuid) {
        return `${this.FILES_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint URL for files
     * @param {string} garUuid The ID of the GAR
     * @param {string} fileId The ID of the file
     * @private
     * @returns {string} The API endpoint
     */
    getFileUrl(garUuid, fileId) {
        return `${this.FILE_ENDPOINT_GENERATOR(garUuid, fileId)}`;
    }


    /**
     * GETs the files for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the files or errors with a reason
     */
    getFiles(req, garUuid) {

        let options = {
            uri: this.getFilesUrl(garUuid),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.files;
            });
        }


    /**
     * GETs the details of files for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the file details or errors with a reason
     */
    getFileDetails(req, garUuid) {

        let options = {
            uri: this.getFilesUrl(garUuid),
            json: true
        };

        return egarRequest(options, req)
        .then(response => {
            const files = response.file_uuids;
            let filePromises = [];

            filePromises = filePromises.concat(_.map(files || [], fileId => {
                let optionsFile = {
                    uri: this.getFileUrl(garUuid, fileId),
                    json: true
                };
                return egarRequest(optionsFile, req);
                }));

            return Promise.all(filePromises);

        }).then(fileResponses => {
            if (fileResponses.length > 0) {
                fileResponses[fileResponses.length - 1].last = true;
            }

            return {
                hasFiles: fileResponses.length > 0,
                files: fileResponses
            };
        });
    }

    /**
     * POSTs the file details for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {Object} values An object containing the file uri + garUuid
     * @returns {Promise} A promise that resolves when the file details have been posted or errors with a reason
     */
    postFileDetails(req, values) {
        const body = {
            'file_link': values.uri
        };

        var options = {
            method: 'POST',
            uri: this.getFilesUrl(values.garUuid),
            body: body,
            json: true,
            followRedirect: true,
            followAllRedirects: true
        };

        return egarRequest(options, req)
            .then(response => {
                    return response.file;
                });
    }

    /**
    * DELETEs a file from a GAR
    * @param {http.IncomingMessage} req The incoming request
    * @param {string} garUuid The UUID of the GAR being edited
    * @param {string} file The UUID of the file being deleted
    * @returns {Promise} A promise that resolves when the file has been deleted, or rejects with an error
    */
    deleteFile(req, garUuid, fileId) {

        const options = {
            method: 'DELETE',
            uri: this.getFileUrl(garUuid, fileId)
        };

        return egarRequest(options, req);

    }
}

module.exports = FileService;
