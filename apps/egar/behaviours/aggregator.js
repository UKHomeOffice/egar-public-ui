'use strict';
const _ = require('lodash');
const FormController = require('hof-form-controller');
const mix = require('mixwith').mix;

/**
 * Filters out falsy values from an array of promises
 * @param {Array} promises The array of promises to filter
 * @returns {Array} A new filtered Array
 * @private
 */
const filterEmptyPromises = promises => {
    return _.filter(promises, p => !!p);
};

/**
 * Handles a function callback from a subBehaviour
 * @param {Object} options The options passed to the aggregate function
 * @param {Function} resolve The function to call to resolve the Promise wrapping the callback
 */
const handleCallback = (options, resolve) => {
    // Non-arrow function because we need to use ```arguments```
    return function cb() {
        const args = Array.prototype.slice.call(arguments);

        resolve(_.zipObject(options.cbParams, args));
    };
};

/**
 * A behaviour aggregator
 */
module.exports = Aggregator => class extends Aggregator {

    /**
     * Creates a new Aggregator instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'Aggregator';
        this.behaviours = [];

        options.subBehaviours.forEach(behaviour => {
            const base = mix(FormController);
            const Controller = class extends base.with.apply(base, [behaviour]) { };
            const subController = new Controller(_.omit(options, 'subBehaviours'));

            subController.log = this.log;
            this.behaviours.push(subController);
        });
    }

    /**
     * Calls each subBehaviour that is being aggregated and returns an array of results
     * @param {Object} options An object comprising:
     *     @field {string} fn The name of the function to aggregate
     *     @field {array} cbParams The callback param names
     *     @field {http.IncomingMessage} req The incoming request
     *     @field {http.ServerResponse} res The response that will be sent to the browser
     *     @field {boolean} defaultToBaseFn Call ${fn} on the aggregator if none of the subBehaviours implement ${fn}
     *
     * @returns {Array} An array of promise results
     */
    aggregate(options) {
        if (!options) {
            throw new Error('No options provided to aggregate');
        }

        let promises = this.behaviours.map(behaviour => {
            // The controller created in the constructor
            const AggregatorController = Object.getPrototypeOf(behaviour);

            // The behaviour class that was mixed in
            const Behaviour = Object.getPrototypeOf(AggregatorController);

            if (!Behaviour.hasOwnProperty(options.fn)) {
                return null;
            }

            return new Promise((resolve) => {
                behaviour[options.fn](options.req, options.res, handleCallback(options, resolve));
            });
        });

        promises = filterEmptyPromises(promises);

        if (promises.length === 0 && options.defaultToBaseFn) {
            const superPromise = new Promise((resolve) => {
                super[options.fn](options.req, options.res, handleCallback(options, resolve));
            });

            promises.unshift(superPromise);
        }

        return Promise.all(promises);
    }

    /**
     * Performs configuration before the request is processed
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call after configure
     */
    configure(req, res, next) {
        super.configure(req, res, () => {
            this.aggregate({
                aggregator: this,
                fn: 'configure',
                cbParams: ['err'],
                req: req,
                res: res
            }).then(results => {
                // Find the first error (if any)
                const e = _.find(results, r => !!r.err);

                if (e) {
                    next(e.err);
                } else {
                    next();
                }
            });
        });
    }

    /**
     * Gets values for the form before setting locals
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        this.aggregate({
            aggregator: this,
            fn: 'getValues',
            cbParams: ['err', 'values'],
            req: req,
            res: res,
            defaultToBaseFn: true
        }).then(results => {
            // Find the first error (if any)
            const e = _.find(results, r => !!r.err);

            // Merge the values, first in wins
            let values = {};
            results.forEach(r => {
                if (r.values) {
                    values = _.defaultsDeep(values, r.values);
                }
            });

            if (!_.isEmpty(_.at(req, 'form.errors')[0])) {
                next(null, req.sessionModel.attributes.errorValues);
            } else if (e) {
                next(e.err, values);
            } else {
                next(null, values);
            }
        });
    }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        let locals = Object.assign({}, super.locals(req, res));

        this.behaviours.forEach(behaviour => {
            Object.assign(locals, behaviour.locals(req, res));
        });

        locals.buttons = locals.buttons || [];

        if (this.behaviours[this.behaviours.length - 1].useDefaultButtons !== false) {
            locals.buttons = locals.buttons.concat([{
                id: 'continue',
                name: 'continue',
                value: req.translate('buttons.continue')
            }]);
        }

        return locals;
    }

    /**
     * Renders the form using the last behaviour in the subBehaviours list
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with an error (if any)
     */
    render(req, res, next) {
        this.behaviours[this.behaviours.length - 1].render(req, res, next);
    }

    /**
     * Processes the form values before validating them
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with an error (if any)
     */
    process(req, res, next) {
        this.aggregate({
            aggregator: this,
            fn: 'process',
            cbParams: ['err'],
            req: req,
            res: res
        }).then(results => {
            // Find the first error (if any)
            const e = _.find(results, r => !!r.err);

            if (e) {
                next(e.err);
            } else {
                next();
            }
        });
    }

    /**
     * Validates the form values before saving them
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with an error (if any)
     */
    validate(req, res, next) {
        this.aggregate({
            aggregator: this,
            fn: 'validate',
            cbParams: ['errors'],
            req: req,
            res: res
        }).then(results => {
            // Merge the errors, first in wins
            let errors = null;
            results.forEach(r => {
                if (r.errors) {
                    errors = (errors ? _.defaultsDeep(errors, r.errors) : r.errors);
                }
            });

            next(errors);
        });
    }

    /**
     * Saves the form values
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with an error (if any)
     */
    saveValues(req, res, next) {
        this.aggregate({
            aggregator: this,
            fn: 'saveValues',
            cbParams: ['err'],
            req: req,
            res: res
        }).then(results => {
            // Find the first error (if any)
            const e = _.find(results, r => !!r.err);

            if (e) {
                next(e.err);
            } else {
                next();
            }
        });
    }
};
