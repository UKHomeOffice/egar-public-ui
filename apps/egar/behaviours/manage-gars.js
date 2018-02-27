'use strict';

const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');

const config = require('../../../config')();
const GarService = require('../services').GarService;
const paging = require('./utils').paging;

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
        this.PAGE_LENGTH = config['gar-page-length'];
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
            const actions = ['edit', 'view', 'cancel'];
            let processed = false;

            _.forEach(actions, action => {
                const summaryAction = _.find(Object.keys(req.body), k => k.indexOf(`${action}-`) === 0);
                if (summaryAction) {
                    let garUuid = summaryAction.replace(`${action}-`, '');
                    req.sessionModel.set('garUuid', garUuid);
                    req.sessionModel.set('summaryMode', action);
                    res.redirect('/egar/summary');
                    processed = true;
                }
            });

            if (!processed) {
                req.form.options.next = `/manage-gars?q=${querystring.escape(req.body.searchTerm)}`;
                super.process(req, res, next);
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

        const searchTerm = req.query.q;
        var currentPage = paging.getCurrentPage(req);
        var numGars = 0;

        this.service.searchGars(req, searchTerm)
            .then(garList => {
                numGars = garList.length;
                /* eslint-disable camelcase */
                garList = paging.getUUIDSForCurrentPage(garList, currentPage, this.PAGE_LENGTH);
                /* eslint-enable camelcase */
                return Promise.all(_.map(garList || [], garUuid => {
                    return garUuid ? this.service.getSummaryDetails(req, garUuid) : null;
                }));
            }).then(garResponses => {
                const pagingData = paging.getPagingData(numGars, currentPage, this.PAGE_LENGTH, req);
                _.forEach(garResponses, gar => {
                    this.formatGARDeparture(gar);
                    this.formatGARStatus(gar, req);
                });
                return {
                    searchTerm: searchTerm,
                    gars: garResponses,
                    paging: pagingData
                };
            })
            .then(gars => {
                next(null, gars);
            }).catch(err => {
                next(err, {});
            });

    }

    /**
     * Formats a GAR departure for display
     * @param {Object} gar The GAR whose departure details should be formatted
     */
    formatGARDeparture(gar) {
        if (gar.location.length > 0) {
            gar.departure = gar.location[0];
            if (!_.isNil(gar.departure) && !_.isNil(gar.departure.datetime)) {
                gar.departure.date = moment(gar.departure.datetime).format('DD MM YYYY');
                gar.departure.time = moment(gar.departure.datetime).format('HH mm');
            }
        }
    }

    /**
     * Formats a GAR status for display
     * @param {Object} gar The GAR whose status should be formatted
     */
    formatGARStatus(gar, req) {
        const status = this.service.getGarStatus(gar, req);
        gar.state = status.displayValue;
        gar.canEdit = !_.includes(
            [this.service.GAR_STATES.SUBMITTED, this.service.GAR_STATES.CANCELLED],
            status.status
        );

        if (status.status === this.service.GAR_STATES.SUBMITTED) {
            // the user can cancel if the gar is submitted and if the current time
            // is before departure, after departure or before arrival by a set limit
            const timeLimit = config['cancel-submission-time-limit-hours'];

            const departure = gar.location[0];
            const arrival = gar.location[1];

            const time = config['cancel-submission-departure-arrival'] === 'departure' ?
                departure.datetime : arrival.datetime;
            const cancellationTime = config['cancel-submission-before-after'] === 'before' ?
                moment(time).subtract(timeLimit, 'h') : moment(time).add(timeLimit, 'h');

            gar.canCancel = moment.utc().isSameOrBefore(cancellationTime);
        }
    }

};
