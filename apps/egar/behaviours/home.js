'use strict';
const GarService = require('../services').GarService;

/**
 * The FormController behaviours for the Home page
 */
module.exports = HomeController => class extends HomeController {

    /**
     * Creates a new HomeController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'HomeController';
        this.service = new GarService();
    }

    configure(req, res, callBack) {
        req.sessionModel.unset('garUuid');
        req.sessionModel.unset('attributes');
        req.sessionModel.unset('summary');
        req.sessionModel.unset('summaryMode');
        callBack();
    }

    /**
     * Gets values for the form before setting locals
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const user = req.headers['x-auth-email'] ? {
            name: `${req.headers['x-auth-given-name']} ${req.headers['x-auth-family-name']}`,
            detailsLink: `${req.headers['x-auth-iss']}/account`
        } : {};

        next(null, user);
    }

    /**
     * Processes button clicks on the form
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    process(req, res, next) {
        if (req.method === 'POST') {
            if (req.body['submit-a-gar']) {
                this.service.postCreateGar(req)
                    .then(resp => {
                        const garUuid = resp.gar_uuid;
                        req.sessionModel.set('garUuid', garUuid);
                        req.form.options.next = '/aircraft';
                        next();
                    })
                    .catch(err => {
                        this.log.error(err);
                        next(err);
                    });
            } else {
                if (req.body['manage-gars']) {
                    req.form.options.next = '/manage-gars';
                }
                next();
            }
        } else {
            next();
        }
    }
};
