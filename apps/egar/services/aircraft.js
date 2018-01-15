'use strict';

const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');

/**
 * The Service for the Departures form
 */
class AircraftService {

    /**
     * Creates a new DeparturesService instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.AIRCRAFT_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/aircraft/`;
        };
    }

    /**
     * Gets the API endpoint for aircraft details
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getAircraftUrl(garUuid) {
        return `${this.AIRCRAFT_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * GETs the aircraft details for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the aircraft details or errors with a reason
     */
    getAircraftDetails(req, garUuid) {

        let options = {
            uri: this.getAircraftUrl(garUuid),
            json: true
        };
        return egarRequest(options, req)
        .then(response => {
                if (response.status === 400) {
                    // TO DO
                } else {
                    let aircraftDetails = {};
                    aircraftDetails['egar-aircraft-registration'] = response.aircraft.registration;
                    aircraftDetails['egar-aircraft-type'] = response.aircraft.type;
                    aircraftDetails['egar-aircraft-base'] = response.aircraft.base;

                    if (response.aircraft.taxesPaid !== null) {
                        aircraftDetails['egar-aircraft-taxes-paid'] = response.aircraft.taxesPaid.toString();
                    }

                  return aircraftDetails;
                }
            })
            .catch(response => {
                // TO DO proper catch
                return response;
            });
    }


    /**
     * POSTs the aircraft details for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Object} form The form values from the departures page
     * @returns {Promise} A promise that resolves with the aircraft details or errors with a reason
     */
    postAircraftDetails(req, garUuid, form) {
        const body = {
           // TO DO as no validation until Beta, putting all fields in if checks
           // put required fields here, that will always be on the form
        };

        if (form['egar-aircraft-registration']) {
          body.registration = form['egar-aircraft-registration'];
        }
        if (form['egar-aircraft-type']) {
          body.type = form['egar-aircraft-type'];
        }
        if (form['egar-aircraft-base']) {
          body.base = form['egar-aircraft-base'];
        }
        if (form['egar-aircraft-taxes-paid']) {
          body.taxesPaid = form['egar-aircraft-taxes-paid'];
        }

        var options = {
            method: 'POST',
            uri: this.getAircraftUrl(garUuid),
            body: body,
            json: true,
            followRedirect: true,
            followAllRedirects: true
        };

        return egarRequest(options, req)
            .then(response => {
                    return response.aircraft;
                }).catch(() => {
                    // console.log(err);
                });
    }
}

module.exports = AircraftService;
