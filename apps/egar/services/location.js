'use strict';

const _ = require('lodash');
const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');

const Location = {
    DEPARTURE: 'departure',
    ARRIVAL: 'arrival'
};

/**
 * The Service for the departure and arrival forms
 */
class LocationService {
    /**
     * Creates a new LocationService instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.DEPARTURE_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/locations/dept/`;
        };

        this.ARRIVAL_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/locations/arr/`;
        };

        this.LOCATIONS_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/locations/`;
        };

        this.LOCATION_ENDPOINT_GENERATOR = (garUuid, locationUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/locations/${locationUuid}`;
        };
    }

    /**
     * Gets the API endpoint for departure details
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getDepartureUrl(garUuid) {
        return `${this.DEPARTURE_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint for arrival details
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getArrivalUrl(garUuid) {
        return `${this.ARRIVAL_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint URL for all eGAR flight locations
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getLocationsUrl(garUuid) {
        return `${this.LOCATIONS_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint URL for an individual eGAR flight location
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @param {string} locationUuid The ID of the location to get
     * @private
     * @returns {string} The API endpoint
     */
    getLocationUrl(garUuid, locationUuid) {
        return `${this.LOCATION_ENDPOINT_GENERATOR(garUuid, locationUuid)}`;
    }

    /* eslint-disable complexity*/
    /**
     * GETs the location details for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @param {Location} location The location to get details for (e.g. 'departure' or 'arrival')
     * @returns {Promise} A promise that resolves with the departure details or errors with a reason
     */
    getLocationDetails(req, garUuid, location) {
        let options = {
            uri: this.getLocationsUrl(garUuid),
            json: true
        };
        return egarRequest(options, req)
            .then(response => {
                return Promise.all(_.map(response.location_uuids, locationUuid => {
                    let summaryOptions = {
                        uri: this.getLocationUrl(garUuid, locationUuid),
                        json: true
                    };
                    return locationUuid ? egarRequest(summaryOptions, req) : null;
                }));
            })
            .then(locationResponses => {
                let details;

                if (location === Location.DEPARTURE) {
                    details = _.find(locationResponses, l => l && l.location && l.location.leg_num === 0);
                } else if (location === Location.ARRIVAL) {
                    details = _.find(locationResponses, l => l && l.location && l.location.leg_num === 1);
                }

                details = details && details.location;

                const formValues = {};

                if (details) {
                    if (details.datetime) {
                        const datetimeParts = details.datetime.replace('Z', '').split('T');

                        formValues[`egar-${location}-date`] = datetimeParts[0] === '1900-01-01' ? '' : datetimeParts[0];
                        formValues[`egar-${location}-time`] = datetimeParts[1] === '00:00:59' ? '' : datetimeParts[1];
                    }

                    formValues[`egar-${location}-icao`] = details.ICAO;

                    if (details.point) {
                        formValues[`egar-${location}-latitude`] = details.point.latitude;
                        formValues[`egar-${location}-longitude`] = details.point.longitude;

                        if (formValues[`egar-${location}-latitude`] || formValues[`egar-${location}-longitude`]) {
                            formValues[`egar-${location}-no-icao`] = 'no-icao';
                            formValues[`egar-${location}-location`] = 'lat-long';
                        }
                    }

                    if (details.IATA) {
                        formValues[`egar-${location}-no-icao`] = 'no-icao';
                        formValues[`egar-${location}-location`] = 'iata';
                        formValues[`egar-${location}-iata`] = details.IATA;
                    }
                }

                return formValues;
            });
    }

    /**
     * Gets a Location body to post to the API
     * @param {http.IncomingRequest} req The Location page form POST
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Location} location The location being updated (e.g. 'departure' or 'arrival')
     * @param {Object} rawForm The request body, contains unprocessed field values
     * @param {Object} form The form values from the departures page
     * @returns {Object} The Location body
     */
    getLocationBody(req, garUuid, location, rawForm, form) {
        const date = form[`egar-${location}-date`] || '1900-01-01';
        const time = form[`egar-${location}-time`] || '00:00:59';
        const datetime = `${date}T${time}Z`;
        const body = {};

        body.datetime = datetime === '1900-01-01T00:00:59Z' ? null : datetime;

        // All other parts of the body are optional
        if (form[`egar-${location}-icao`]) {
            if (Object.keys(rawForm).indexOf(`egar-${location}-icao-autocomplete`) >= 0) {
                body.ICAO = rawForm[`egar-${location}-icao-autocomplete`];
            } else {
                body.ICAO = form[`egar-${location}-icao`];
            }
            body.ICAO = body.ICAO && body.ICAO.length > 0 ? body.ICAO : null;

            body.point = null;
            body.IATA = null;
        } else if (form[`egar-${location}-iata`]) {
            if (Object.keys(rawForm).indexOf(`egar-${location}-iata-autocomplete`) >= 0) {
                body.IATA = rawForm[`egar-${location}-iata-autocomplete`];
            } else {
                body.IATA = form[`egar-${location}-iata`];
            }
            body.IATA = body.IATA && body.IATA.length > 0 ? body.IATA : null;
            body.point = null;
            body.ICAO = null;
        } else if (form[`egar-${location}-latitude`] || form[`egar-${location}-longitude`]) {
            body.point = {
                latitude: rawForm[`egar-${location}-latitude`] || null,
                longitude: rawForm[`egar-${location}-longitude`] || null
            };
            body.ICAO = null;
            body.IATA = null;
        }

        return body;
    }
    /* eslint-enable complexity*/

    /**
     * POSTs the location details for a GAR
     * @param {http.IncomingRequest} req The Location page form POST
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Location} location The location being updated (e.g. 'departure' or 'arrival')
     * @param {Object} rawForm The request body, contains unprocessed field values
     * @param {Object} form The form values from the departures page
     * @returns {Promise} A promise that resolves with the departure details or errors with a reason
     */
    postLocationDetails(req, garUuid, location, rawForm, form) {

        const body = this.getLocationBody(req, garUuid, location, rawForm, form);
        const uri = location === Location.ARRIVAL ? this.getArrivalUrl(garUuid) : this.getDepartureUrl(garUuid);
        const options = {
            method: 'POST',
            uri: uri,
            json: true,
            followRedirect: true,
            followAllRedirects: true,
            body: body
        };
        return egarRequest(options, req);
    }
    /* eslint-enable complexity*/
}

module.exports = {
    LocationService: LocationService,
    Location: Location
};

