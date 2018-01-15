'use strict';

const _ = require('lodash');
const config = require('../../../config')();
const moment = require('moment');
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

                return Promise.all(_.map(response.gar_uuids || [], garUuid => {
                    let summaryOptions = {
                        uri: this.getSummaryGarUrl(garUuid),
                        json: true
                    };
                    return garUuid ? egarRequest(summaryOptions, req) : null;
                }));
            })
            .then(garResponses => {

                _.forEach(garResponses, gar => {
                    if (gar.location.length > 0) {
                        gar.departure = gar.location[0];
                        if (!_.isNil(gar.departure) && !_.isNil(gar.departure.datetime)) {
                            gar.departure.date = moment(gar.departure.datetime).format('DD/MM/YYYY');
                            gar.departure.time = moment(gar.departure.datetime).format('HH:mm');
                        }
                    }

                    const status = this.getGarStatus(gar, req);
                    gar.state = status.displayValue;
                    gar.canEdit = !_.includes([this.GAR_STATES.SUBMITTED, this.GAR_STATES.CANCELLED], status.status);

                    if (status.status === this.GAR_STATES.SUBMITTED) {
                        // the user can cancel if the gar is submitted and if the current time
                        // is before departure, after departure or before arrival by a set limit
                        const timeLimit = config['cancel-submission-time'];

                        const departure = gar.location[0];
                        const arrival = gar.location[1];

                        const time = config['cancel-submission-departure-arrival'] === 'departure' ?
                        departure.datetime : arrival.datetime;
                        const cancellationTime = config['cancel-submission-before-after'] === 'before' ?
                        moment(time).subtract(timeLimit, 'h') : moment(time).add(timeLimit, 'h');

                        gar.canCancel = moment().isSameOrBefore(cancellationTime);
                    }
                });

                return {
                    gars: garResponses
                };
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

}

module.exports = GarService;
