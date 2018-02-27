'use strict';
const _ = require('lodash');
const querystring = require('querystring');

const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');


/**
 * The Service for dealing with GARs
 */
class GarService {
    /**
     * Creates a new GarService instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.GARS_ENDPOINT_GENERATOR = () => {
            return `${baseUrl}/WF/GARs/`;
        };

        this.GAR_SUMMARY_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/summary/`;
        };

        this.GAR_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/`;
        };

        this.GAR_SEARCH_ENDPOINT_GENERATOR = (searchTerm) => {
            if (searchTerm) {
                return `${baseUrl}/WF/search/GARs/?search_criteria=${querystring.escape(searchTerm)}`;
            }
            return `${baseUrl}/WF/search/GARs/`;
        };

        this.GAR_STATES = {
            DRAFT: 'DRAFT',
            PENDING: 'PENDING',
            SUBMITTED: 'SUBMITTED',
            FAILED: 'FAILED',
            CANCELLED: 'CANCELLED'
        };
    }

    /**
     * Gets the API endpoint for getting an existing GAR
     * @private
     * @returns {string} The API endpoint
     */
    getGarUrl(garUuid) {
        return `${this.GAR_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint for creating a new GARs
     * @private
     * @returns {string} The API endpoint
     */
    getGarsUrl() {
        return `${this.GARS_ENDPOINT_GENERATOR()}`;
    }


    /**
     * Gets the API endpoint URL for:
     * GET - Retrieves people assoicated with the logged in users account
     * @returns {string} The API endpoint
     */
    getGarsSearchUrl(searchTerm) {
        return `${this.GAR_SEARCH_ENDPOINT_GENERATOR(searchTerm)}`;
    }

    /**
     * Gets the GAR.
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid the gar id
     */
    getGar(req, garUuid) {
        let options = {
            uri: this.getGarUrl(garUuid),
            json: true
        };
        return egarRequest(options, req);
    }

    /**
     * Gets all gars for the user.
     * @param {http.IncomingMessage} req The incoming request
     */
    getGars(req) {

        let options = {
            uri: this.getGarsUrl(),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response;
            });
    }

    /**
     * Gets the API endpoint for retrieving the summary GAR.
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getSummaryGarUrl(garUuid) {
        return `${this.GAR_SUMMARY_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * POSTs to create a new GAR
     * @param {http.IncomingMessage} req The incoming request
     * @returns {Promise} A promise that resolves with a new GARs details or errors with a reason
     */
    postCreateGar(req) {
        const url = this.getGarsUrl();
        const options = {
            method: 'POST',
            uri: url,
            followRedirect: true,
            followAllRedirects: true,
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response;
            });
    }

    /**
     * GETs the summary details for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the departure details or errors with a reason
     */
    getSummaryDetails(req, garUuid) {
        const options = {
            method: 'GET',
            uri: this.getSummaryGarUrl(garUuid),
            json: true,
            followRedirect: true,
            followAllRedirects: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response;
            }).catch(() => {
                // console.log(err);
            });
    }

    /**
     * Returns the gar status.
     *
     * @param {any} gar
     * @param {http.IncomingMessage} req The incoming request
     * @returns {string} gar status
     *
     * @memberOf GarService
     */
    getGarStatus(gar, req) {
        const status = _.at(gar, 'submission.status')[0] || this.GAR_STATES.DRAFT;
        return {
            status: status,
            displayValue: req.translate(`gar-states.${status}`)
        };
    }


     /**
     * Returns the list of gar uuids matching search term.
     * If no search term provided, returns all
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} searchTerm The data to search for
     * @returns {gar_uuids} list of uuids
     *
     * @memberOf GarService
     */
    searchGars(req, searchTerm) {
        let options = {
            method: 'GET',
            uri: this.getGarsSearchUrl(searchTerm),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.gar_uuids;
            });
    }

}

module.exports = GarService;
