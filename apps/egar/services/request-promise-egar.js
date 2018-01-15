'use strict';

const _ = require('lodash');
const request = require('request-promise');

/**
 * Gets headers to forward from the incoming request
 * @param {Object} options Configuration object that contains any required headers to send downstream.
 * @param {http.IncomingMessage} req The incoming request
 */
const getHeaders = (options, req) => {
    const requiredHeaders = (options.requiredHeaders || []).concat(['authorization', 'x-auth-subject']);

    return _.pick(req.headers, requiredHeaders);
};

/**
 * Wraps request-promise to forward headers from incoming to outgoing requests
 * @param {Object} options request-promise options
 * @param {http.IncomingMessage} req The incoming request
 * @returns {Promise} A Promise that resolves when the request completes or rejects on error
 */
module.exports = (options, req) => {
    options.headers = getHeaders(options, req);
    options = _.omit(options, 'requiredHeaders');
    return request(options);
};
