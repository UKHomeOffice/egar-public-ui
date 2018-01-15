'use strict';
const _ = require('lodash');
const PersonService = require('../services').PersonService;

/**
 * The FormController behaviours for the people table
 */
module.exports = PeopleController => class extends PeopleController {

    /**
     * Creates a new PeopleController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'PeopleController';
        this.service = new PersonService();
    }

    /**
     * Performs configuration before the request is processed
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call after configure
     */
    configure(req, res, next) {
        if (req.sessionModel.get('summary')) {
            res.locals.backLink = 'summary';
        }
        next();
    }

    /**
     * Processes button clicks on the form
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    process(req, res, next) {

        if (req.method === 'POST' && !req.body.continue) {

            let personIdToModify = _.find(Object.keys(req.body),
                k => ((k.indexOf('delete:') === 0)
                     || (k.indexOf('edit:') === 0)
                     || (k.indexOf('add-new:') === 0))
                );

            personIdToModify = personIdToModify.split(':');
            const task = personIdToModify[0];
            const personType = personIdToModify[1];
            const personID = personIdToModify[2];
            const garUuid = req.sessionModel.get('garUuid');

            req.form.options.next = req.form.options.route;

            switch (task) {

                case 'add-new':
                    // Redirect to the person type form and remove any stored person data
                    req.form.options.next = '/person-type';
                    req.sessionModel.unset('personId');
                    req.sessionModel.unset('person');
                    req.sessionModel.unset('attributes');
                    super.process(req, res, next);
                    break;

                case 'delete':
                    this.service.deletePerson(req, garUuid, personID)
                    .then(() => {
                        // Redirect to the peoples form
                        req.form.options.next = req.form.options.route;
                        super.process(req, res, next);
                    });
                    break;

                case 'edit':

                    let nextPath;
                    switch (personType.toLocaleLowerCase()) {
                        case 'captain':
                            nextPath = '/captain-general';
                            break;
                        case 'crew':
                            nextPath = '/crew-general';
                            break;
                        case 'passenger':
                            nextPath = '/passenger-general';
                            break;
                        default:
                            nextPath = req.form.options.route;
                            break;
                    }
                    // Redirect to the peoples form
                    req.form.options.next = nextPath;
                    req.sessionModel.set('personId', personID);
                    super.process(req, res, next);
                    break;

                default:
                    super.process(req, res, next);
                    break;
            }
        } else {
            if (req.sessionModel.get('summary')) {
                req.form.options.next = '/summary';
            }

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
        const garUuid = req.sessionModel.get('garUuid');
        this.service.getPeopleDetails(req, garUuid)
            .then(people => {
                next(null, people);
            }).catch(err => {
                next(err, {});
            });
        }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        const locals = super.locals(req, res);

        locals.buttons = [{
            id: 'add-new::',
            name: 'add-new:',
            value: req.translate('buttons.add-new')
        }];
        // ,
        // {
        //     id: 'use-existing::',
        //     name: 'use-existing:',
        //     value: req.translate('buttons.use-existing')
        // }];

        return locals;
    }
};
