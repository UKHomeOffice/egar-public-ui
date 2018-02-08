'use strict';
const GarService = require('../services').GarService;
const SubmitService = require('../services').SubmitService;
const _ = require('lodash');
const moment = require('moment');
/* eslint-disable  implicit-dependencies/no-implicit */
const countries = require('country-list');

const config = require('../../../config')();
const MAX_SUBMISSION_POLLS = config['max-submission-polls'];
const PENDING_FILE_STATES = ['UPLOADING', 'AWAITING_VIRUS_SCAN'];

/**
 * The FormController behaviours for the Summary page
 */
module.exports = SummaryController => class extends SummaryController {

    /**
     * Creates a new SummaryController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'SummaryController';
        this.service = new GarService();
        this.submitService = new SubmitService();
        this.useDefaultButtons = false;
    }

    /**
     * Performs configuration before the request is processed
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call after configure
     */
    configure(req, res, next) {
        const summaryMode = req.sessionModel.get('summaryMode');

        if (summaryMode) {
            res.locals.backLink = 'manage-gars';
        } else if (!req.sessionModel.get('supportingFiles')) {
            // If the user has come from the supporting files page, skipping upload-files
            // set the back link to go there instead of upload-files.
            res.locals.backLink = 'supporting-files';
        }

        next();
    }

    /**
     * Gets values for the form
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        req.sessionModel.unset('summary');

        const garUuid = req.sessionModel.get('garUuid');
        const summaryMode = req.sessionModel.get('summaryMode');
        const summaryErrors = req.sessionModel.get('garErrors');

        const showErrors = summaryMode !== 'view';

        this.service.getSummaryDetails(req, garUuid)
            .then(summaryDetails => {
                const summaryObj = this.createSummary(summaryDetails, summaryMode, summaryErrors, showErrors, req);
                next(null, summaryObj);
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
        let locals = Object.assign({}, super.locals(req, res));
        const summary = req.form.values.summary || {};
        locals.title = summary.heading ? summary.heading : 'GAR summary';

        locals.buttons = [];

        if (summary.showCancelButton) {
            locals.buttons.push({
                id: 'cancel-gar',
                name: 'cancel-gar',
                value: req.translate('buttons.cancel-gar')
            });
        }

        if (summary.showReturnButton) {
            locals.buttons.push({
                id: 'return',
                name: 'return',
                value: req.translate('buttons.return')
            });
        }

        if (summary.showContinueButton) {
            locals.buttons.push({
                id: 'continue',
                name: 'continue',
                value: req.translate('buttons.continue')
            });
        }

        return locals;
    }

    /**
     * Creates a GAR summary object to use to render the page template
     * @param {Object} summaryDetails The summary details returned from the Workflow API
     * @param {String} summaryMode The page mode (one of 'edit', 'view' or 'cancel')
     * @param {Array} summaryErrors An array of problems with the GAR
     * @param {Boolean} showErrors Should errors be shown
     * @returns {Object} The collated summary
     */
    createSummary(summaryDetails, summaryMode, summaryErrors, showErrors, req) {
        let summary = {};

        summary.garUuid = summaryDetails.gar_uuid;

        this.getAircraftDetails(summary, summaryDetails);
        this.getAttributes(summary, summaryDetails);
        this.getLocations(summary, summaryDetails);
        this.getPeople(summary, summaryDetails);
        this.getHazardousGoods(summary, summaryDetails);
        this.getFiles(summary, summaryDetails, req);
        this.getSummaryMode(summary, summaryMode);

        if (showErrors) {
            this.getSummaryErrors(summary, summaryErrors);
        }
        summary.state = this.service.getGarStatus(summaryDetails, req).displayValue;

        return summary;
    }

    getAircraftDetails(summary, summaryDetails) {
        summary.aircraftExists = false;
        if (!_.isNil(summaryDetails.aircraft)) {
            summary.aircraftExists = true;
            summary.aircraft = {
                registration: summaryDetails.aircraft.registration,
                type: summaryDetails.aircraft.type,
                base: summaryDetails.aircraft.base,
            };
            if (!_.isNil(summaryDetails.aircraft.taxesPaid)) {
                summary.aircraft.taxesPaid = summaryDetails.aircraft.taxesPaid ? 'Yes' : 'No';
            }
        }
    }

    getAttributes(summary, summaryDetails) {
        summary.attributesExists = false;
        if (!_.isNil(summaryDetails.attributes)) {
            summary.attributesExists = true;
            summary.attributes = summaryDetails.attributes;
        }
    }

    getLocations(summary, summaryDetails) {
        this.getDeparture(summary, summaryDetails);
        this.getArrivals(summary, summaryDetails);
    }

    getPointString(point) {
        const location =
            `${_.isNil(point.latitude) ? '' : point.latitude}, ${_.isNil(point.longitude) ? '' : point.longitude}`;
        return location === ', ' ? '' : location;
    }

    getDeparture(summary, summaryDetails) {
        summary.departureExists = false;

        if (!_.isNil(summaryDetails.location)
            && Array.isArray(summaryDetails.location)
            && summaryDetails.location.length > 0) {
            if (!_.isNil(summaryDetails.location[0])) {
                summary.departureExists = true;

                let date = '';
                let time = '';
                let location = '';

                if (!_.isNil(summaryDetails.location[0].datetime)) {
                    const hasDate = moment(summaryDetails.location[0].datetime).year() !== 1900;
                    const hasTime = moment(summaryDetails.location[0].datetime).seconds() !== 59;
                    date = hasDate ? moment(summaryDetails.location[0].datetime).format('DD MM YYYY') : '';
                    time = hasTime ? moment(summaryDetails.location[0].datetime).format('HH mm') : '';
                }

                if (!_.isNil(summaryDetails.location[0].ICAO)) {
                    location = summaryDetails.location[0].ICAO;
                } else if (!_.isNil(summaryDetails.location[0].IATA)) {
                    location = summaryDetails.location[0].IATA;
                } else if (!_.isNil(summaryDetails.location[0].point)) {
                    location = this.getPointString(summaryDetails.location[0].point);
                }

                summary.departure = {
                    date: date,
                    time: time,
                    location: location
                };
            }


        }
    }

    getArrivals(summary, summaryDetails) {
        summary.arrivalExists = false;

        const numLocationIndex = summaryDetails.location.length - 1;
        if (numLocationIndex >= 1 && !_.isNil(summaryDetails.location[numLocationIndex])) {

            let date = '';
            let time = '';
            let location = '';

            if (!_.isNil(summaryDetails.location[numLocationIndex].datetime)) {
                const hasDate = moment(summaryDetails.location[numLocationIndex].datetime).year() !== 1900;
                const hasTime = moment(summaryDetails.location[numLocationIndex].datetime).seconds() !== 59;
                date = hasDate ? moment(summaryDetails.location[numLocationIndex].datetime).format('DD MM YYYY') : '';
                time = hasTime ? moment(summaryDetails.location[numLocationIndex].datetime).format('HH mm') : '';
            }

            if (!_.isNil(summaryDetails.location[numLocationIndex].ICAO)) {
                location = summaryDetails.location[numLocationIndex].ICAO;
            } else if (!_.isNil(summaryDetails.location[numLocationIndex].IATA)) {
                location = summaryDetails.location[numLocationIndex].IATA;
            } else if (!_.isNil(summaryDetails.location[numLocationIndex].point)) {
                location = this.getPointString(summaryDetails.location[numLocationIndex].point);
            }

            summary.arrivalExists = true;
            summary.arrival = {
                date: date,
                time: time,
                location: location,
            };
        }
    }

    getPeople(summary, summaryDetails) {
        summary.captainExists = false;
        summary.crewExist = false;
        summary.passengersExist = false;
        if (!_.isNil(summaryDetails.people)) {
            this.getCaptain(summary, summaryDetails);
            this.getCrew(summary, summaryDetails);
            this.getPassengers(summary, summaryDetails);
        }
    }

    getCaptain(summary, summaryDetails) {
        if (!_.isNil(summaryDetails.people.captain)) {
            summary.captainExists = true;
            summary.captain = this.createPerson(summaryDetails.people.captain, summaryDetails.attributes, null, null);
        }
    }

    getCrew(summary, summaryDetails) {

        if (!_.isNil(summaryDetails.people.crew)
            && Array.isArray(summaryDetails.people.crew)
            && summaryDetails.people.crew.length > 0) {

            summary.crewExist = true;
            summary.crew = [];

            for (let i = 0; i < summaryDetails.people.crew.length; i++) {

                let isLast = false;
                if (i === summaryDetails.people.crew.length - 1) {
                    isLast = true;
                }

                let crewMember = this.createPerson(summaryDetails.people.crew[i], null, isLast, i);

                summary.crew.push(crewMember);
            }
        }
    }

    getPassengers(summary, summaryDetails) {
        if (!_.isNil(summaryDetails.people.passengers)
            && Array.isArray(summaryDetails.people.passengers)
            && summaryDetails.people.passengers.length > 0) {

            summary.passengersExist = true;
            summary.passengers = [];

            for (let i = 0; i < summaryDetails.people.passengers.length; i++) {

                let isLast = false;
                if (i === summaryDetails.people.passengers.length - 1) {
                    isLast = true;
                }

                let passenger = this.createPerson(summaryDetails.people.passengers[i], null, isLast, i);

                summary.passengers.push(passenger);
            }
        }
    }

    createPerson(person, attributes, isLast, i) {
        let responsiblePerson;
        if (!_.isNil(attributes) && !_.isNil(attributes.responsible_person)) {
            responsiblePerson = attributes.responsible_person;
            if (responsiblePerson.type && responsiblePerson.type === 'CAPTAIN') {
                responsiblePerson.type = 'Captain';
                responsiblePerson.captainResponsible = true;
            } else if (responsiblePerson.type && responsiblePerson.type === 'OTHER') {
                responsiblePerson.type = 'Other';
                responsiblePerson.captainResponsible = false;
            }
        }
        return {
            forename: person.details.given_name,
            surname: person.details.family_name,
            number: i,
            gender: _.upperFirst(_.lowerCase(person.details.gender)),
            address: person.details.address,
            dob: person.details.dob ? moment(person.details.dob).format('DD MM YYYY') : '',
            place: person.details.place,
            nationality: person.details.nationality ?
                countries().getName(person.details.nationality) : '',
            documentType: person.details.document_type === 'idcard'
                ? 'Identity card' : person.details.document_type,
            documentNo: person.details.document_no,
            documentExpiry: person.details.document_expiryDate ?
                moment(person.details.document_expiryDate).format('DD MM YYYY') : '',
            documentIssueCountry: person.details.document_issuingCountry ?
                countries().getName(person.details.document_issuingCountry) : '',
            responsiblePerson: responsiblePerson,
            id: person.person_uuid,
            isLast: isLast
        };
    }

    getHazardousGoods(summary, summaryDetails) {
        summary.hazardousExists = false;

        if (!_.isNil(summaryDetails.attributes)
            && !_.isNil(summaryDetails.attributes.hazardous)) {

            summary.hazardousExists = true;
            summary.hazardous = { goods: summaryDetails.attributes.hazardous ? 'Yes' : 'No' };
        }
    }

    getFiles(summary, summaryDetails, req) {
        summary.filesExist = false;
        if (!_.isNil(summaryDetails.files)) {
            summary.files = [];
            summary.hasPendingFiles = false;
            summary.metaRefreshTime = config['meta-refresh-time'];

            for (let i = 0; i < summaryDetails.files.length; i++) {
                summary.filesExist = true;
                let isLast = false;
                if (i === summaryDetails.files.length - 1) {
                    isLast = true;
                }

                if (PENDING_FILE_STATES.includes(summaryDetails.files[i].file_status)) {
                    summary.hasPendingFiles = true;
                }

                let file = {
                    filename: summaryDetails.files[i].file_name,
                    filestatus: req.translate(`file-states.${summaryDetails.files[i].file_status}`),
                    fileId: summaryDetails.files[i].file_uuid,
                    isLast: isLast
                };

                summary.files.push(file);
            }
        }
    }

    getSummaryMode(summary, summaryMode) {
        switch (summaryMode) {
            case 'cancel':
                summary.summary = {
                    heading: 'Cancel my GAR',
                    subheading: 'Please check and review your GAR details before you proceed to cancel.',
                    showChange: false,
                    mode: summaryMode,
                    showCancelButton: true,
                    showReturnButton: true,
                    showContinueButton: false
                };
                break;
            case 'view':
                summary.summary = {
                    heading: 'View my GAR',
                    subheading: '',
                    showChange: false,
                    mode: summaryMode,
                    showCancelButton: false,
                    showReturnButton: true,
                    showContinueButton: false
                };
                break;
            case 'edit':
                summary.summary = {
                    heading: 'Edit my GAR',
                    subheading: 'Please check and review your GAR details before you proceed to submit.',
                    showChange: true,
                    mode: summaryMode,
                    showCancelButton: false,
                    showReturnButton: false,
                    showContinueButton: true
                };
                break;
            default:
                summary.summary = {
                    heading: 'GAR summary',
                    subheading: 'Please check and review your GAR details before you proceed to submit.',
                    showChange: true,
                    mode: 'summary',
                    showCancelButton: false,
                    showReturnButton: false,
                    showContinueButton: true
                };
                break;
        }
    }

    getSummaryErrors(summary, summaryErrors) {
        if (summaryErrors) {
            if (summaryErrors.validation) {
                summary.validationError = summaryErrors;
                const errors = summaryErrors.validation;

                summary.aircraft = _.merge(summary.aircraft, {
                    registrationError:
                        this.findError(errors, 'aircraft-registration'),
                    typeError: this.findError(errors, 'aircraft-type'),
                    baseError: this.findError(errors, 'aircraft-base'),
                    taxesPaidError: this.findError(errors, 'aircraft-taxesPaid')
                });

                summary.departure = _.merge(summary.departure, {
                    dateError: _.find(errors, e => e.field === 'departure-future-date'
                        || e.field === 'departure-arrival-date-error')
                        ? summary.departure.date : this.findError(errors, 'departure-date'),
                    timeError: _.find(errors, e => e.field === 'departure-future-date'
                        || e.field === 'departure-arrival-date-error')
                        ? summary.departure.time : this.findError(errors, 'departure-time'),
                    locationError: _.find(errors, e =>
                        e.field === 'departure-arrival-location-error')
                        ? _.at(summary, 'departure.location')[0] : this.findError(errors, 'departure-location')
                });

                summary.arrival = _.merge(summary.arrival, {
                    dateError: _.find(errors, e =>
                        e.field === 'arrival-future-date' || e.field === 'departure-arrival-date-error')
                        ? summary.arrival.date : this.findError(errors, 'arrival-date'),
                    timeError: _.find(errors, e => e.field === 'arrival-future-date'
                        || e.field === 'departure-arrival-date-error')
                        ? summary.arrival.time : this.findError(errors, 'arrival-time'),
                    locationError: _.find(errors, e =>
                        e.field === 'departure-arrival-location-error')
                        ? _.at(summary, 'arrival.location')[0] : this.findError(errors, 'arrival-location')
                });

                summary.hazardous = _.merge(summary.hazardous,
                    { goodsError: this.findError(errors, 'hazardous-goods') }
                );

                summary.noCaptain = this.findError(errors, 'no-captain');

                summary.captain = _.merge(summary.captain,
                    { forenameError: this.findError(errors, 'captain-given_name') },
                    { surnameError: this.findError(errors, 'captain-family_name') },
                    { dobError: this.findError(errors, 'captain-dob') },
                    { placeError: this.findError(errors, 'captain-place') },
                    { nationalityError: this.findError(errors, 'captain-nationality') },
                    { documentTypeError: this.findError(errors, 'captain-document_type') },
                    { documentNoError: this.findError(errors, 'captain-document_no') },
                    { documentExpiryError: this.findError(errors, 'captain-document_expiryDate') },
                    { documentIssueError: this.findError(errors, 'captain-document_issuingCountry') },
                    { responsiblePersonError: this.findError(errors, 'captain-responsible-person-type') },
                    { responsiblePersonNameError: this.findError(errors, 'captain-responsible-person-name') },
                    { responsiblePersonNumberError: this.findError(errors, 'captain-responsible-person-number') }
                );

                summary.crew = _.forEach(summary.crew, crew => {
                    _.merge(crew,
                        { forenameError: this.findError(errors, 'crew-given_name', crew.id) },
                        { surnameError: this.findError(errors, 'crew-family_name', crew.id) },
                        { dobError: this.findError(errors, 'crew-dob', crew.id) },
                        { placeError: this.findError(errors, 'crew-place', crew.id) },
                        { nationalityError: this.findError(errors, 'crew-nationality', crew.id) },
                        { documentTypeError: this.findError(errors, 'crew-document_type', crew.id) },
                        { documentNoError: this.findError(errors, 'crew-document_no', crew.id) },
                        { documentExpiryError: this.findError(errors, 'crew-document_expiryDate', crew.id) },
                        { documentIssueError: this.findError(errors, 'crew-document_issuingCountry', crew.id) }
                    );
                });

                summary.passengers = _.forEach(summary.passengers, passenger => {
                    _.merge(passenger,
                        { forenameError: this.findError(errors, 'passengers-given_name', passenger.id) },
                        { surnameError: this.findError(errors, 'passengers-family_name', passenger.id) },
                        { dobError: this.findError(errors, 'passengers-dob', passenger.id) },
                        { placeError: this.findError(errors, 'passengers-place', passenger.id) },
                        { nationalityError: this.findError(errors, 'passengers-nationality', passenger.id) },
                        { documentTypeError: this.findError(errors, 'passengers-document_type', passenger.id) },
                        { documentNoError: this.findError(errors, 'passengers-document_no', passenger.id) },
                        { documentExpiryError: this.findError(errors, 'passengers-document_expiryDate', passenger.id) },
                        {
                            documentIssueError:
                                this.findError(errors, 'passenger-document_issuingCountry', passenger.id)
                        }
                    );
                });

                summary.files = _.forEach(summary.files, file => {
                    _.merge(file, {
                        fileNameError: this.findError(errors, 'files', file.fileId)
                            ? file.filename : null
                    },
                        { fileStatusError: this.findError(errors, 'files', file.fileId) ? file.filestatus : null });
                });

                summary.aircraftExists = !!summary.aircraft;
                summary.departureExists = !!summary.departure;
                summary.arrivalExists = !!summary.arrival;
                summary.hazardousExists = !!summary.hazardous;
            } else {
                summary.error = summaryErrors;
            }
        }
    }

    findError(validation, field, id) {
        const error = id ? _.find(validation, err => ((err.field === field) && _.includes(err.id, id)))
            : _.find(validation, err => (err.field === field));
        return _.isNil(error) ? '' : error.message;
    }

    /**
     * Processes the form values before validating them
     * @param {http.IncomingMessage} req The POST request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with an error (if any)
     */
    process(req, res, next) {
        if (req.body.change_location) {
            req.sessionModel.set('summary', true);
            res.redirect(`/egar/${req.body.change_location}`);
        } else if (req.body['cancel-gar']) {
            this.cancelGar(req, res, next);
        } else if (req.body.return) {
            res.redirect('manage-gars');
        } else {
            next();
        }
    }

    /**
     * Cancels the submitted GAR.
     *
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    cancelGar(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const garStates = this.service.GAR_STATES;

        let getStatusAttempt = req.query.r || 0;
        getStatusAttempt++;

        this.submitService.getSubmissionResult(req, garUuid)
            .then(response => {
                const state = this.service.getGarStatus(response, req).status;
                let promise;

                if (state === garStates.SUBMITTED) {
                    promise = this.submitService.cancelSubmittedGar(req, garUuid)
                        .then(() => {
                            return this.submitService.pollForCancellationCompletion(req, garUuid);
                        }, (err) => {
                            return err;
                        });
                } else {
                    if (getStatusAttempt === MAX_SUBMISSION_POLLS) {
                        promise = new Promise(resolve => {
                            resolve({
                                status: 'TIMEOUT',
                                reason: req.translate('errors.cancellation-timeout')
                            });
                        });
                    }
                    promise = this.submitService.pollForCancellationCompletion(req, garUuid);
                }

                return promise;
            }).then(response => {
                if (response.status === garStates.CANCELLED) {
                    res.redirect('/egar/manage-gars');
                    next();
                } else {
                    const error = {
                        reason: (response && response.statusCode === 403 ?
                            req.translate('errors.cancellation-error') :
                            req.translate('errors.cancellation-failed'))
                    };
                    req.sessionModel.set('garErrors', error);
                    res.redirect('/egar/summary?e=1');
                }
            }, () => {
                // Called when the polling times out
                // Temporary work around until we have a more elegant solution for long-running requests
                res.redirect(307, `/egar/summary?r=${getStatusAttempt}`);
            }).catch(() => {
                const error = { reason: req.translate('errors.cancellation-failed') };
                req.sessionModel.set('garErrors', error);
                res.redirect('/egar/summary?e=2');
            });
    }

};
