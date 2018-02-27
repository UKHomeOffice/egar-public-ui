'use strict';

const _ = require('lodash');
const querystring = require('querystring');

const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');

/**
 * The Service for the person forms
 */
class PersonService {

    /**
     * Creates a new PersonService instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.PERSONS_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/persons/`;
        };

        this.PERSON_ENDPOINT_GENERATOR = (garUuid, personId) => {
            return `${baseUrl}/WF/GARs/${garUuid}/persons/${personId}/`;
        };

        this.PERSON_SEARCH_ENDPOINT_GENERATOR = (searchTerm) => {
            if (searchTerm) {
                return `${baseUrl}/WF/search/persons/?search_criteria=${querystring.escape(searchTerm)}`;
            }
            return `${baseUrl}/WF/search/persons/`;
        };

        this.PERSON_BULK_ENDPOINT_GENERATOR = () => {
            return `${baseUrl}/WF/summaries/persons/`;
        };

    }

    /**
     * The API endpoint URL for all people in a GAR
     * @param {string} garUuid The ID of the GAR
     * @private
     * @returns {string} The API endpoint
     */
    getPersonsUrl(garUuid) {
        return `${this.PERSONS_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets the API endpoint URL for a person
     * @param {string} garUuid The ID of the GAR
     * @param {string} personId The ID of the person
     * @private
     * @returns {string} The API endpoint
     */
    getPersonUrl(garUuid, personId) {
        return `${this.PERSON_ENDPOINT_GENERATOR(garUuid, personId)}`;
    }

    /**
     * Gets the API endpoint URL for:
     * GET - Retrieves people assoicated with the logged in users account
     * @returns {string} The API endpoint
     */
    getPersonSearchUrl(searchTerm) {
        return `${this.PERSON_SEARCH_ENDPOINT_GENERATOR(searchTerm)}`;
    }

    /**
     * Gets the API endpoint URL for:
     * GET - Retrieves people assoicated with the logged in users account
     * @returns {string} The API endpoint
     */
    getPersonBulkUrl() {
        return `${this.PERSON_BULK_ENDPOINT_GENERATOR()}`;
    }

    /**
     * GETs the people for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the people or errors with a reason
     */
    getPeopleForGAR(req, garUuid) {

        let options = {
            uri: this.getPersonsUrl(garUuid),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.people;
            });

    }

    /**
     * GETs multiple people by their IDs (not scoped to a GAR)
     * @param {http.IncomingMessage} req The incoming request
     * @param {Array} ids An array of UUIDs of people to get
     * @returns {Promise} A promise that resolves with the people or errors with a reason
     */
    getPeople(req, ids) {
        /*eslint-disable*/
        const body = {
            person_uuids: ids
        };
        /*eslint-enable*/
        let options = {
            method: 'POST',
            uri: this.getPersonBulkUrl(),
            json: true,
            body: body
        };

        return egarRequest(options, req)
            .then(response => {
                return response.people;
            });
    }

    /**
     * GETs the details of people for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the people details or errors with a reason
     */
    getPeopleDetails(req, garUuid) {

        let options = {
            uri: this.getPersonsUrl(garUuid),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                const people = response.people;
                let peoplePromises = [];

                if (people.captain) {

                    let optionsCaptain = {
                        uri: this.getPersonUrl(garUuid, people.captain),
                        json: true
                    };

                    peoplePromises.push(
                        egarRequest(optionsCaptain, req)
                    );

                }

                peoplePromises = peoplePromises.concat(_.map(people.crew || [], crewId => {
                    let optionsCrew = {
                        uri: this.getPersonUrl(garUuid, crewId),
                        json: true
                    };

                    return egarRequest(optionsCrew, req);

                }));

                peoplePromises = peoplePromises.concat(_.map(people.passengers || [], passengerId => {
                    let optionsCrew = {
                        uri: this.getPersonUrl(garUuid, passengerId),
                        json: true
                    };

                    return egarRequest(optionsCrew, req);
                }));

                return Promise.all(peoplePromises);
            }).then(peopleResponses => {
                if (peopleResponses.length > 0) {
                    peopleResponses[peopleResponses.length - 1].lastPerson = true;

                    peopleResponses = _.map(peopleResponses, p => {
                        return this.formatPerson(p.person);
                    });
                }

                return {
                    hasPeople: peopleResponses.length > 0,
                    people: peopleResponses
                };
            });
    }

    formatPerson(person) {
        if (person.type) {
            person.type = person.type.toLowerCase();
        }

        let date;
        if (person.details.document_expiryDate) {
            date = person.details.document_expiryDate.split('-');
            person.details.documentExpiryDatePrettyPrint = date[2] + ' ' + date[1] + ' ' + date[0];
        }
        if (person.details.dob) {
            date = person.details.dob.split('-');
            person.details.dobPrettyPrint = date[2] + ' ' + date[1] + ' ' + date[0];
        }

        /* eslint-disable camelcase */
        person.full_name = `${person.details.given_name} ${person.details.family_name}`;
        /* eslint-enable camelcase */
        return person;
    }

    /**
     * GETs a person for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @param {string} personId The ID of the person being viewed/edited
     * @returns {Promise} A promise that resolves with the person or errors with a reason
     */
    getPerson(req, garUuid, personId) {

        const options = {
            uri: this.getPersonUrl(garUuid, personId),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                let person = response.person;
                person = this.formatPerson(person);
                return person;
            });
    }

    /**
     * POSTs a new person for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Object} form The form values from the calling page
     * @returns {Promise} A promise that resolves with the person or errors with a reason
     */
    postPerson(req, garUuid, form) {
        const body = {
            type: form['egar-person-type'],
            details: {}
        };

        const options = {
            method: 'POST',
            uri: this.getPersonsUrl(garUuid),
            json: true,
            body: body,
            followAllRedirects: true
        };
        return egarRequest(options, req)
            .then(response => {
                return response.person;
            });
    }

    /**
     * POSTs the new person for a GAR
     * @param {Object} req The request object from the calling page
     * @param {uuid} garUuid The ID of the GAR to attach person to
     * @param {uuid} personUuid The ID of the person to attach to the GAR
     * @param {Object} form The form values from the calling page
     * @returns {Promise} A promise that resolves with the person or errors with a reason
     */
    postExistingPerson(req, garUuid, personUuid, form) {
        /* eslint-disable camelcase */
        const body = {
            type: form['egar-person-type'],
            person_uuid: personUuid
        };
        /* eslint-enable camelcase */

        const options = {
            method: 'POST',
            uri: this.getPersonsUrl(garUuid),
            json: true,
            body: body,
            followAllRedirects: true
        };
        return egarRequest(options, req)
            .then(response => {
                return response.person;
            });
    }

     /**
     * POSTs an update to a person for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Object} form The form values from the partial person page
     * @param {Object} personId The id of the person
     * @param {Object} person The complete person
     * @returns {Promise} A promise that resolves with the person or errors with a reason
     */
    updatePerson(req, garUuid, form, personId, person) {
        const personForm = _.mergeWith(person, form);
        /* eslint-disable camelcase*/
        let body = {
            type: personForm['egar-person-type'],
            details: {
                given_name: personForm['egar-person-given-name'],
                family_name: personForm['egar-person-family-name'],
                gender: personForm['egar-person-gender'],
                address: personForm['egar-person-uk-address'],
                dob: personForm['egar-person-dob'],
                place: personForm['egar-person-birth-place'],
                nationality: personForm['egar-person-nationality-country'],
                document_type: personForm['egar-person-travel-document-type'],
                document_no: personForm['egar-person-travel-document-number'],
                document_expiryDate: personForm['egar-person-travel-document-expiry'],
                document_issuingCountry: personForm['egar-person-travel-document-country']
            }
        };
        /* eslint-enable camelcase*/

        body.details = _.pickBy(body.details, detail => !!detail);

        const options = {
            method: 'POST',
            uri: this.getPersonUrl(garUuid, personId),
            json: true,
            body: body,
            followAllRedirects: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.location;
            });
    }

        /**
         * DELETEs a person for a GAR
         * @param {http.IncomingMessage} req The incoming request
         * @param {string} garUuid The UUID of the GAR being edited
         * @param {string} personId The UUID of the person being deleted
         * @returns {Promise} A promise that resolves when the person has been deleted, or rejects with an error
         */
        deletePerson(req, garUuid, personId) {

        const options = {
            method: 'DELETE',
            uri: this.getPersonUrl(garUuid, personId)
        };

        return egarRequest(options, req);

    }

    /**
     * POSTs the new person for a GAR
     * @param {Object} req The request object from the calling page
     * @param {uuid} garUuid The ID of the GAR to attach person to
     * @param {uuid} personUuid The ID of the person to attach to the GAR
     * @param {Object} form The form values from the calling page
     * @returns {Promise} A promise that resolves with the person or errors with a reason
     */
    postExistingPerson(req, garUuid, personUuid, form) {
        /* eslint-disable*/
        const body = {
            type: form['egar-person-existing-type'],
            person_uuid: personUuid
        };
        /* eslint-enable*/
        const options = {
            method: 'POST',
            uri: this.getPersonsUrl(garUuid),
            json: true,
            body: body,
            followAllRedirects: true
        };
        return egarRequest(options, req)
            .then(response => {
                return response.person;
            });
    }


     /**
     * Returns the list of person uuids matching search term.
     * If no search term provided, returns all
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} searchTerm The data to search for
     * @returns {person_uuids} list of uuids
     *
     * @memberOf PersonService
     */
    searchPeople(req, searchTerm) {

        let options = {
            method: 'GET',
            uri: this.getPersonSearchUrl(searchTerm),
            json: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.person_uuids;
            });
    }
}

module.exports = PersonService;
