'use strict';

const _ = require('lodash');
const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');

/**
 * The Service for the Goods/Responsible Person forms
 */
class AttributesService {

    /**
     * Creates a new attributes service instance
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.ATTRIBUTES_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/attributes/`;
        };
    }

    /**
     * Gets the API endpoint for attributes
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @private
     * @returns {string} The API endpoint
     */
    getAttributesUrl(garUuid) {
        return `${this.ATTRIBUTES_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * GETs the attributes for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being viewed/edited
     * @returns {Promise} A promise that resolves with the attributes or errors with a reason
     */
    getAttributes(req, garUuid) {
        let options = {
            uri: this.getAttributesUrl(garUuid),
            json: true
        };
        return egarRequest(options, req)
            .then(response => {
                let formValues = {};

                if (response.attributes.hazardous !== null) {
                    formValues['egar-goods-declaration'] = response.attributes.hazardous.toString();
                }

                const responsible = response.attributes.responsible_person;
                if (responsible) {
                    formValues['egar-person-responsible'] = responsible.type ? responsible.type.toLowerCase() : null;
                    formValues['egar-person-responsible-name'] = responsible.name;
                    formValues['egar-person-responsible-number'] = responsible.contact_number;
                }

                formValues = _.pickBy(formValues, value => !!value);
                return formValues;
            });
    }

    /**
     * POSTs the attributes for a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The ID of the GAR being edited
     * @param {Object} attributes The current GAR attributes
     * @param {Object} form The form values from the Goods/Responsible Person page
     * @returns {Promise} A promise that resolves when the attributes have been posted, or errors with a reason
     */
    postAttributes(req, garUuid, attributes, form) {
        const attributeForm = _.mergeWith(attributes, form);
        const body = {};

        if (attributeForm['egar-cta-declaration']) {
            body.CTA = attributeForm['egar-cta-declaration'];
        }

        if (attributeForm['egar-goods-declaration']) {
            body.hazardous = attributeForm['egar-goods-declaration'];
        }

        if (attributeForm['egar-person-responsible']) {
            /* eslint-disable camelcase*/
            body.responsible_person = {
                type: attributeForm['egar-person-responsible']
            };
            if (attributeForm['egar-person-responsible'] === 'other') {
                body.responsible_person.name = attributeForm['egar-person-responsible-name'];
                body.responsible_person.contact_number = attributeForm['egar-person-responsible-number'];
            }
            /* eslint-enable camelcase*/
        }

        var options = {
            method: 'POST',
            uri: this.getAttributesUrl(garUuid),
            body: body,
            json: true,
            followRedirect: true,
            followAllRedirects: true
        };

        return egarRequest(options, req)
            .then(response => {
                return response.attributes;
            }).catch(() => {
                // 400 response when there are no attributes
            });
    }
}

module.exports = AttributesService;
