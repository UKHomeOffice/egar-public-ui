'use strict';
const _ = require('lodash');
const config = require('../config')();

/**
 * The default behaviour controller.
 */
module.exports = BaseController => class extends BaseController {

    /**
     * Creates a new BaseController instance
     * @param {Object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'BaseController';
        this.logger = config.logger;

        // Wrap logger to provide useful context when messages are logged.
        this.log = {
            error: item => {
                this.logger.error(this.$className);
                this.logger.error(item);
            },
            warn: item => {
                this.logger.warn(this.$className);
                this.logger.warn(item);
            },
            info: item => {
                this.logger.info(this.$className);
                this.logger.info(item);
            },
            debug: item => {
                this.logger.debug(this.$className);
                this.logger.debug(item);
            },
            verbose: item => {
                this.logger.verbose(this.$className);
                this.logger.verbose(item);
            }
        };
    }


    /**
     * Performs configuration before the request is processed
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call after configure
     */
    configure(req, res, next) {
        super.configure(req, res, () => {
            this.fixBackLink(req, res);
            this.clearResidualErrors(req);
            next();
        });
    }

    /**
     * Fixes the back link to reflect where the user has come from.
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    fixBackLink(req, res) {
        const referrer = req.get('Referrer') || '';
        const sessionModel = req.sessionModel;

        if (!sessionModel) {
            return;
        }

        if (referrer === '') {
            req.sessionModel.unset('lastPage');
        } else if (referrer.includes('/egar/') && !referrer.includes(req.url)) {
            req.sessionModel.set('lastPage', referrer.split('egar/')[1]);
        }

        const lastPage = req.sessionModel.get('lastPage');
        this.log.debug(`Referred to ${req.url} by ${referrer}`);
        this.log.debug(`lastPage set to ${lastPage}`);

        // If the user has come from the summary page, set the back link to go to the summary page.
        if (lastPage && !req.url.includes('manage-gars')) {
            res.locals.backLink = lastPage.includes('summary') ? 'summary' : res.locals.backLink;
        }
    }

    /**
     * Clears errors left on the sessionModel
     * if a user navigates away from a page
     * with errors still present.
     * @param {http.IncomingMessage} req The incoming page request
     */
    clearResidualErrors(req) {
        const errors = _.at(req, 'sessionModel.attributes.errors')[0];

        if (!_.isEmpty(errors)) {
            const formFields = _.at(req, 'form.options.fields')[0] || {};
            const fieldNames = Object.keys(formFields);

            Object.keys(errors).forEach(k => {
                if (!_.includes(fieldNames, k)) {
                    delete errors[k];
                }
            });
        }

        if (_.isEmpty(errors)) {
            req.sessionModel.attributes.errorValues = {};
        }
    }
};
