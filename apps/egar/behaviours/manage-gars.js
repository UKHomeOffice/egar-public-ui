'use strict';

const GarService = require('../services').GarService;
const _ = require('lodash');

/**
 * The FormController behaviours for the Manage Gars page
 */
module.exports = GarController => class extends GarController {

    /**
     * Creates a new GarController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'GarController';
        this.service = new GarService();
    }

    /**
     * Processes button clicks on the form
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    process(req, res, next) {
        if (req.method === 'POST') {
            if (req.body.submit === 'Search') {
                // TO-DO: Integrate with API when searching functionality and validate dates.

                // const body = {
                //     depatureDateFrom: req.body['egar-manage-gars-date-from'],
                //     depatureDateTo: req.body['egar-manage-gars-date-to']
                // };
            } else {
                const actions = ['edit', 'view', 'cancel'];

                _.forEach(actions, action => {
                    const summaryAction = _.find(Object.keys(req.body), k => k.indexOf(`${action}-`) === 0);
                    if (summaryAction) {
                        let garUuid = summaryAction.replace(`${action}-`, '');
                        req.sessionModel.set('garUuid', garUuid);
                        req.sessionModel.set('summaryMode', action);
                        res.redirect('/egar/summary');
                    }
                });
            }
        } else {
            super.process(req, res, next);
        }
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        req.sessionModel.unset('garUuid');
        req.sessionModel.unset('summary');
        req.sessionModel.unset('summaryMode');
        this.service.getGars(req)
            .then(gars => {
                next(null, gars);
            }).catch(err => {
                next(err, {});
            });
    }
};
