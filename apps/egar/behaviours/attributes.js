'use strict';
const AttributesService = require('../services').AttributesService;
const GarService = require('../services').GarService;

/**
 * The FormController behaviours for the CTA and Goods form
 */
module.exports = AttributesController => class extends AttributesController {

    /**
     * Creates a new AttributesController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'AttributesController';
        this.service = new AttributesService();
        this.garService = new GarService();
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        this.garService.getGar(req, garUuid).then(gar => {
            if (gar.attributes) {
                this.service.getAttributes(req, garUuid)
                .then(attribute => {
                    req.sessionModel.set('attributes', attribute);
                    next(null, attribute);
                }).catch(err => {
                    next(err, {});
                });
            } else {
                next();
            }
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
    const garUuid = req.sessionModel.get('garUuid');
    const attributes = req.sessionModel.get('attributes');
    this.service.postAttributes(req, garUuid, attributes, req.body)
        .then(() => {
            next();
        })
        .catch(err => {
             next(err);
        });
  }
};

