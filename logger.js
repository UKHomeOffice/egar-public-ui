'use strict';

/**
 * Lifted from hof/lib/logger.js as HOF doesn't expose its logger to HOF applications,
 * and we don't want to dig in to the node_modules folder to get it.
 */
const winston = require('winston');

module.exports = (config) => {

    const loggingTransports = [];
    const exceptionTransports = [];
    const notProd = config.env !== 'production';

    loggingTransports.push(
        new winston.transports.Console({
            silent: config.loglevel === 'silent',
            level: config.loglevel,
            json: !notProd,
            timestamp: true,
            colorize: true,
            stringify: function stringify(obj) {
                return JSON.stringify(obj);
            }
        })
    );

    exceptionTransports.push(
        new winston.transports.Console({
            json: !notProd,
            timestamp: true,
            colorize: true,
            stringify: function stringify(obj) {
                return JSON.stringify(obj);
            }
        })
    );

    const transports = {
        transports: loggingTransports,
        exceptionHandlers: exceptionTransports,
        exitOnError: true
    };

    if (notProd) {
        delete transports.exceptionHandlers;
    }

    const logger = new winston.Logger(transports);

    return logger;
};
