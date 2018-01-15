'use strict';
const _ = require('lodash');
const moment = require('moment');

const config = require('../../../config')();
const SubmitService = require('../services').SubmitService;
const GarService = require('../services').GarService;

const MAX_SUBMISSION_POLLS = config['max-submission-polls'];

/**
 * The FormController behaviours for the Submit page
 */
module.exports = SubmitController => class extends SubmitController {

    /**
     * Creates a new SummaryController instance
     * @param {object} options
     */
    constructor(options) {
        super(options);
        this.$className = 'SubmitController';
        this.service = new SubmitService();
        this.garService = new GarService();
        this.useDefaultButtons = false;
    }

    /**
     * Gets values.
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    getValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        this.service.getSubmissionResult(req, garUuid)
            .then(response => {
                const gar = {
                    garUuid: garUuid,
                    state: this.garService.getGarStatus(response, req).status
                };
                next(null, gar);
            }).catch(err => {
                next(err, {});
            });

    }

    /**
     * Validates the GAR.
     * If there are errors the user is taken back to the summary page.
     *
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call with values when they're ready
     */
    validate(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        let validationErrors = [];

        if (req.body['submit-gar']) {
            this.garService.getSummaryDetails(req, garUuid)
                .then(gar => {
                    // validate every section
                    validationErrors = validationErrors.concat(
                        this.validateAircraft(gar.aircraft, req),
                        this.validateLocations(gar.location, req),
                        this.validateGoods(gar.attributes, req),
                        this.validateCaptain(gar, req),
                        this.validateCrewOrPassengers(gar, 'crew', req),
                        this.validateCrewOrPassengers(gar, 'passengers', req),
                        this.validateFiles(gar.files, req)
                    );

                    // Remove any null errors
                    validationErrors = _.filter(validationErrors, e => !!e);

                    if (validationErrors.length > 0) {
                        req.sessionModel.set('garErrors', {
                            validation: validationErrors
                        });
                        res.redirect('/egar/summary');
                    } else {
                        next();
                    }
                }).catch(err => {
                    next(err, {});
                });
        } else {
            next();
        }
    }

    /**
     * Makes sure that a required field has been filled in on the GAR.
     * @param {string} field The name of the field to check
     * @param {Object} section The part of the GAR summary to check in
     * @param {string} sectionName The name of the section
     * @param {IncomingMessage} req The GET request for the submission page
     * @param {string} id (optional) The id that uniquely identifies the section being checked,
     *                     used if the section name alone is not a unique identifier
     * @returns {Object|null} An error object, or null if the required field has been filled in.
     */
    validateRequiredField(field, section, sectionName, req, id) {
        let validationError = null;
        if (!section || _.isNil(section[field])) {
            const message = id ? req.translate(`errors.${field}`) : req.translate(`errors.${sectionName}-${field}`);
            validationError = {
                field: `${sectionName}-${field}`,
                heading: req.translate(`errors.${sectionName}-error`),
                message: message,
                id: [id]
            };
        }

        return validationError;
    }

    /**
     * Validates the aircraft section of the GAR.
     * @param {Object} aircraft The aircraft details summary section
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateAircraft(aircraft, req) {
        // All fields are mandatory.
        const requiredFields = ['registration', 'type', 'base', 'taxesPaid'];

        return requiredFields.map(f => {
            return this.validateRequiredField(f, aircraft, 'aircraft', req);
        });
    }

    /**
     * Validates the location place, date and time has been set
     * @param {Object} location The location details summary section
     * @param {string} type The type of location being tested, one of [departure|arrival]
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateLocation(location, type, req) {
        const heading = req.translate(`errors.${type}-error`);
        const validationErrors = [];

        const hasPlace = location && (
            location.ICAO ||
            location.IATA ||
            (location.point && location.point.latitude && location.point.longitude)
        );

        validationErrors.push(hasPlace ? null : {
            field: `${type}-location`,
            heading: heading,
            message: req.translate(`errors.${type}-location`)
        });

        const hasDateError = !this.validateDate(location && location.datetime);
        const hasTimeError = !this.validateTime(location && location.datetime);
        const hasDateFutureError = !hasDateError && moment(location.datetime).isSameOrBefore();

        if (hasDateError) {
            const messageDate = req.translate(`errors.${type}-date`);
            validationErrors.push({ field: `${type}-date`, heading: heading, message: messageDate });
        } else if (hasDateFutureError) {
            const messageDate = req.translate(`errors.${type}-future-date`);
            validationErrors.push({ field: `${type}-future-date`, heading: heading, message: messageDate });
        }

        if (hasTimeError) {
            const messageTime = req.translate(`errors.${type}-time`);
            validationErrors.push({ field: `${type}-time`, heading: heading, message: messageTime });
        }

        return validationErrors;
    }

    /* eslint-disable complexity*/
    /**
     * Validates the locations
     * Check the arrival date is after the departure date
     * @param {Object} locations The locations
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateLocations(locations, req) {
        const validationErrors = _.filter(_.concat(this.validateLocation(locations[0],
            'departure', req), this.validateLocation(locations[1], 'arrival', req)), e => !!e);

        const departure = locations[0] || {};
        const arrival = locations[1] || {};

        const hasDateError = _.isEmpty(validationErrors)
            && moment(departure.datetime).isSameOrAfter(arrival.datetime);

        const departureLocation = departure.ICAO || departure.IATA ||
             (departure.point && `${departure.point.latitude}, ${departure.point.longitude}`);

        const arrivalLocation = arrival.ICAO || arrival.IATA ||
            (arrival.point && `${arrival.point.latitude}, ${arrival.point.longitude}`);


        if (hasDateError) {
            validationErrors.push({
                field: 'departure-arrival-date-error',
                heading: req.translate('errors.arrival-error'),
                message: req.translate('errors.departure-arrival-date-error')
            });
        }

        if (departureLocation === arrivalLocation && !_.isNil(departureLocation)) {
            validationErrors.push({
                field: 'departure-arrival-location-error',
                heading: req.translate('errors.arrival-error'),
                message: req.translate('errors.departure-arrival-location-error')
            });
        }

        return validationErrors;
    }
    /* eslint-enable complexity*/


    /**
     * Validates the hazardous goods section.
     * @param {Object} attributes The attributes summary section
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateGoods(attributes, req) {
        const validationErrors = [];

        // The only field in this section is required
        if (!attributes || _.isNil(attributes.hazardous)) {
            validationErrors.push({
                field: 'hazardous-goods',
                heading: req.translate('errors.hazardous-error'),
                message: req.translate('errors.hazardous-goods')
            });
        }

        return validationErrors;
    }

    /**
     * Validates the captain section.
     * @param {Object} gar The GAR summary
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateCaptain(gar, req) {
        let validationErrors = [];

        const requiredFields = ['given_name', 'family_name', 'dob', 'place', 'nationality',
            'document_type', 'document_no', 'document_expiryDate', 'document_issuingCountry'];

        const captain = gar && gar.people && gar.people.captain;

        // Validates captain
        if (!captain) {
            validationErrors.push({
                field: 'no-captain',
                heading: req.translate('errors.captain-error'),
                message: req.translate('errors.no-captain-error')
            });
        } else {
            validationErrors = validationErrors.concat(
                requiredFields.map(f => {
                    return this.validateRequiredField(f, captain.details, 'captain', req, captain.person_uuid);
                }),
                this.validateResponsiblePerson(gar.attributes, req)
            );
        }

        return validationErrors;
    }

    /**
     * Validates the crew and passenger sections
     * @param {Object} gar The GAR summary
     * @param {string} type The type of people to validate, one of [crew|passengers]
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateCrewOrPassengers(gar, type, req) {
        let validationErrors = [];

        const requiredFields = ['given_name', 'family_name', 'dob', 'place', 'nationality',
            'document_type', 'document_no', 'document_expiryDate', 'document_issuingCountry'];

        const hasPeople = gar && gar.people && gar.people[type] && !_.isEmpty(gar.people[type]);

        if (hasPeople) {
            gar.people[type].forEach(p => {
                validationErrors = validationErrors.concat(requiredFields.map(f => {
                    return this.validateRequiredField(f, p.details, type, req, p.person_uuid);
                }));
            });
        }

        return validationErrors;
    }

    /**
     * Validates that a responsible person has been entered on the GAR.
     * There should be a responsible person.
     * If the responsible person is OTHER -
     * name and contact number are required.
     *
     * @param {Object} attributes The attributes summary section
     * @param {IncomingMessage} req The GET request for the submission page
     * @returns {Array} An array of validation errors
     */
    validateResponsiblePerson(attributes, req) {
        const validationErrors = [];

        if (!attributes || !attributes.responsible_person) {
            validationErrors.push({
                field: 'captain-responsible-person',
                heading: req.translate('errors.captain-error'),
                message: req.translate('errors.responsible-person-type')
            });
        } else if (attributes.responsible_person.type === 'OTHER') {
            if (_.isEmpty(attributes.responsible_person.name)) {
                validationErrors.push({
                    field: 'captain-responsible-person-name',
                    heading: req.translate('errors.captain-error'),
                    message: req.translate('errors.responsible-person-name')
                });
            }
            if (_.isEmpty(attributes.responsible_person.contact_number)) {
                validationErrors.push({
                    field: 'captain-responsible-person-number',
                    heading: req.translate('errors.captain-error'),
                    message: req.translate('errors.responsible-person-number')
                });
            }
        }

        return validationErrors;
    }

    /**
     * Validates that a date portion of a datetime has been entered
     * (EGAR defaults to 01-01-1900 if the date portion of a datetime is not entered)
     * @param {string} datetime An ISO-8601 date string
     * @returns {boolean} true if the date portion of the datetime is valid, else false
     */
    validateDate(datetime) {
        return (!!datetime && moment(datetime).year() !== 1900);
    }

    /**
     * Validates that a time portion of a datetime has been entered
     * (EGAR defaults to 00:00:59 if the time portion of a datetime is not entered, as the user cannot enter seconds)
     * @param {string} datetime An ISO-8601 date string
     * @returns {boolean} true if the time portion of the datetime is valid, else false
     */
    validateTime(datetime) {
        return (!!datetime && moment(datetime).seconds() !== 59);
    }

    /**
     * Validates the files.
     * All files must have a state of VIRUS_SCANNED to be valid.
     *
     * @param {any} files
     * @param {any} req
     * @returns {Array} an array of validation errors
     */
    validateFiles(files, req) {
        const validationErrors = [];
        let errorMessage;
        if (files) {
            _.forEach(files, file => {
                switch (file.file_status) {
                    case 'UPLOADING':
                    case 'AWAITING_VIRUS_SCAN':
                        errorMessage = 'errors.file-pending';
                        break;
                    case 'QUARANTINED':
                        errorMessage = 'errors.file-virus';
                        break;
                    case 'VIRUS_SCANNED':
                        break;
                    case 'UPLOAD_FAILED':
                    default:
                        errorMessage = 'errors.file-error';
                        break;

                }
                const i = _.findIndex(validationErrors, err => err.message === req.translate(errorMessage));

                if (errorMessage) {
                    if (i === -1) {
                        validationErrors.push({
                            field: 'files',
                            heading: req.translate('errors.upload-error'),
                            message: req.translate(errorMessage),
                            id: [file.file_uuid]
                        });
                    } else {
                        validationErrors[i].id.push(file.file_uuid);
                    }
                }
            });
        }
        return validationErrors;
    }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        const locals = super.locals(req, res);

        locals.buttons = [{
            id: 'submit-gar',
            name: 'submit-gar',
            value: req.translate('buttons.submit-gar')
        }, {
            id: 'save-as-draft',
            name: 'save-as-draft',
            value: req.translate('buttons.save-as-draft')
        }];

        return locals;
    }

    /**
    * Submits the GAR
    * @param {http.IncomingMessage} req The POST request
    * @param {http.ServerResponse} res The response that will be sent to the browser
    * @param {Function} next The function to call to continue the pipeline
    */
    saveValues(req, res, next) {
        const garUuid = req.sessionModel.get('garUuid');
        const garStates = this.garService.GAR_STATES;

        if (req.body['submit-gar']) {
            let getStatusAttempt = req.query.r || 0;
            getStatusAttempt++;

            this.service.getSubmissionResult(req, garUuid)
                .then(response => {
                    const state = this.garService.getGarStatus(response, req).status;
                    let promise;

                    if (_.includes([garStates.DRAFT, garStates.FAILED], state)) {
                        promise = this.service.submitGar(req, garUuid)
                            .then(() => {
                                return this.service.pollForSubmissionCompletion(req, garUuid);
                            }, () => {
                                return {
                                    status: 'FAILED'
                                };
                            });
                    } else {
                        if (getStatusAttempt === MAX_SUBMISSION_POLLS) {
                            promise = new Promise(resolve => {
                                resolve({
                                    status: 'TIMEOUT',
                                    reason: req.translate('errors.submission-timeout')
                                });
                            });
                        }
                        promise = this.service.pollForSubmissionCompletion(req, garUuid);
                    }

                    return promise;
                })
                .then(submission => {
                    if (submission.status === garStates.SUBMITTED) {
                        next();
                    } else {
                        const error = {
                            reason: (submission.reason || req.translate('errors.submission-failed'))
                        };
                        req.sessionModel.set('garErrors', error);
                        res.redirect('/egar/summary?e=3');
                    }
                }, () => {
                    // Called when the polling times out
                    // Temporary work around until we have a more elegant solution for long-running requests
                    res.redirect(307, `/egar/submit?r=${getStatusAttempt}`);
                })
                .catch(err => {
                    next(err);
                });
        } else if (req.body['save-as-draft']) {
            res.redirect('/egar/manage-gars');
        }
    }

};
