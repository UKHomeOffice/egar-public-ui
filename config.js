'use strict';

const _ = require('lodash');
const parseArgs = require('minimist');

const requiredSettings = ['egar-workflow-api-url', 'file-upload-storage-type'];
// Parse the command used to start the application,
// Ignore the node executable and the script name
const processConfig = parseArgs(process.argv.slice(2));

// Apply defaults in case no config variables were supplied on the command line
let config = {};
_.defaultsDeep(config, processConfig, {
    'egar-workflow-api-url': 'http://workflow-api-proxy:8010/api/v1',
    'egar-workflow-version-url': 'http://workflow-api-proxy:8010/info',
    // Stop waiting for submission to complete, in a given request, after 5 seconds
    'submission-poll-timeout': 1000 * 5,
    // Poll for submission status update every second
    'submission-poll-frequency': 1000,
    // Poll for submission status changing a maximum of 10 times (10 x submission-poll-timeout = 50s)
    // After the 10 time, with no resolution, the user will be informed that the submission is still pending.
    'max-submission-polls': 10,
    // Cancellation check of the limit Before or After the given time
    'cancel-submission-before-after': 'after',
    // Cancellation check of the limit on the Departure or Arrival time
    'cancel-submission-departure-arrival': 'departure',
    // The Time limit for cancelling a submitted GAR
    'cancel-submission-time': 1,
    // The travel document expiry date max value to add to the current date
    // currently set to yesterday
    'travel-doc-expiry-date-value': -1,
    // The travel document expiry date maximum type (d=days) to add to the current date
    'travel-doc-expiry-date-type': 'd',
    'file-upload-storage-type': 'local',
    'file-upload-bucket': 'egar-file-upload-test',
    'file-upload-acl': 'public-read-write',
    'file-upload-secret-access-key': 'replace me',
    'file-upload-access-key-id': 'replace me',
    'file-upload-aws-region': 'eu-west-2',
    // maximum file size in bytes 10MB
    'file-upload-max-file-size': 10 * 1024 * 1024,
    // file types
    'file-upload-file-types': [
        // pdf
        'application/pdf',
        // jpg
        'image/jpeg',
        'image/pjpeg',
        // png
        'image/png',
        // doc
        'application/msword',
        // docx
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // xls
        'application/excel',
        'application/vnd.ms-excel',
        'application/x-excel',
        // xlsx
        'application/x-msexcel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    'meta-refresh-time': 20,
    validate: () => {
        let valid = true;

        requiredSettings.forEach(s => {
            if (!config[s]) {
                /* eslint-disable no-console */
                config.logger.error(`Required config setting '${s}' not provided.`);
                /* eslint-enable no-console */
                valid = false;
            }
        });

        return valid;
    }
});

config['file-upload-storage-type'] = (config['file-upload-storage-type'] || 'local').toLowerCase();

config['file-upload-storage-options'] = {
    bucket: config['file-upload-bucket'],
    acl: config['file-upload-acl']
};

config['file-upload-aws-config'] = {
    secretAccessKey: config['file-upload-secret-access-key'],
    accessKeyId: config['file-upload-access-key-id'],
    region: config['file-upload-aws-region']
};

/**
 * Provides config to be used in the eGAR applications
 */
module.exports = logger => {
    if (logger) {
        config.logger = logger;
    }

    return config;
};
