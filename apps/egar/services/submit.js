'use strict';

const config = require('../../../config')();
const egarRequest = require('./request-promise-egar');
const SUBMISSION_POLL_TIMEOUT = config['submission-poll-timeout'];
const SUBMISSION_POLL_FREQUENCY = config['submission-poll-frequency'];

/**
 * The Service for the submitting, editing and cancelling a GAR.
 */
class SubmitService {

    /**
     * Creates an instance of SubmitService.
     * @param {any} options
     *
     * @memberOf SubmitService
     */
    constructor(options) {
        const baseUrl = options && options.baseUrl || config['egar-workflow-api-url'];

        this.SUBMISSION_ENDPOINT_GENERATOR = (garUuid) => {
            return `${baseUrl}/WF/GARs/${garUuid}/Submission/`;
        };
    }

    /**
     * Gets the API endpoint for getting and posting a submission.
     *
     * @param {any} garUuid
     * @returns {string} The API endpoint
     *
     * @memberOf SubmitService
     */
    getSubmitUrl(garUuid) {
        return `${this.SUBMISSION_ENDPOINT_GENERATOR(garUuid)}`;
    }

    /**
     * Gets last the result of the last submission for a GAR.
     *
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The UUID of the GAR to check
     * @returns
     *
     * @memberOf SubmitService
     */
    getSubmissionResult(req, garUuid) {
        let options = {
            uri: this.getSubmitUrl(garUuid),
            json: true
        };

        return egarRequest(options, req)
            .catch(err => {
                if (err.statusCode === 400) {
                    return null;
                }
            });
    }

    /**
     * POSTs to submit a GAR
     * @param {http.IncomingMessage} req The incoming request
     * @param {string} garUuid The UUID of the GAR to submit
     * @returns {Promise} A promise that resolves when the GAR is submitted or errors with a reason
     *
     * @memberOf SubmitService
     */
    submitGar(req, garUuid) {
        const options = {
            method: 'POST',
            uri: this.getSubmitUrl(garUuid),
            followRedirect: true,
            followAllRedirects: true,
            json: true
        };

        return egarRequest(options, req);
    }

    /**
     * Polls for a submission reaching its final state
     *  @param {http.IncomingMessage} req The incoming request
     *  @param {string} garUuid The UUID of the GAR to check
     *  @returns {Promise} A promise that resolves when the submission status reaches a final state,
     *                     or rejects after the configured 'submission-poll-timeout'
     * @memberOf SubmitService
     */
    pollForSubmissionCompletion(req, garUuid) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            const finalStates = ['SUBMITTED', 'FAILED', 'CANCELLED'];
            const intervalId = setInterval(() => {
                this.getSubmissionResult(req, garUuid)
                    .then(submissionResult => {
                        const submission = submissionResult && submissionResult.submission;
                        if (submission && finalStates.indexOf(submission.status) >= 0) {
                            clearInterval(intervalId);
                            clearTimeout(timeoutId);
                            resolve(submission);
                        }
                    });
            }, SUBMISSION_POLL_FREQUENCY);

            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`Submission was still pending after ${SUBMISSION_POLL_TIMEOUT}ms`));
            }, SUBMISSION_POLL_TIMEOUT);
        });
    }

    /**
     * Polls for a submission cancellation reaching its final state
     *  @param {http.IncomingMessage} req The incoming request
     *  @param {string} garUuid The UUID of the GAR to check
     *  @returns {Promise} A promise that resolves when the status reaches a final state,
     *                     or rejects after the configured 'submission-poll-timeout'
     * @memberOf SubmitService
     */
    pollForCancellationCompletion(req, garUuid) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            const finalStates = ['SUBMITTED', 'FAILED', 'CANCELLED'];
            const intervalId = setInterval(() => {
                this.getSubmissionResult(req, garUuid)
                    .then(submissionResult => {
                        const submission = submissionResult && submissionResult.submission;
                        if (submission && finalStates.indexOf(submission.status) >= 0) {
                            clearInterval(intervalId);
                            clearTimeout(timeoutId);
                            resolve(submission);
                        }
                    });
            }, SUBMISSION_POLL_FREQUENCY);

            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`Cancellation was still pending after ${SUBMISSION_POLL_TIMEOUT}ms`));
            }, SUBMISSION_POLL_TIMEOUT);
        });
    }

    /**
     * Cancels a submitted GAR before the arrival time.
     *  @param {http.IncomingMessage} req The incoming request
     *  @param {string} garUuid The UUID of the GAR to cancel
     *  @returns {Promise} A promise that resolves when the submission status reaches a final state,
     *                     or rejects after the configured 'submission-poll-timeout'
     * @memberOf SubmitService
     */
    cancelSubmittedGar(req, garUuid) {
        const options = {
            method: 'DELETE',
            uri: this.getSubmitUrl(garUuid),
            followRedirect: true,
            followAllRedirects: true,
            json: true
        };

        return egarRequest(options, req);
    }

}

module.exports = SubmitService;
