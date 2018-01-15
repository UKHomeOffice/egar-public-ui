'use strict';

const _ = require('lodash');
const describe = require('mocha').describe;
const it = require('mocha').it;
const beforeEach = require('mocha').beforeEach;
const afterEach = require('mocha').afterEach;
const expect = require('chai').expect;
const mock = require('sinon').mock;

describe('config', () => {
    let originalArgv;
    let stubLogger;

    beforeEach(() => {
        originalArgv = _.clone(process.argv);

        stubLogger = {
            error: () => { }
        };
    });

    afterEach(() => {
        delete require.cache[require.resolve('../config')];

        process.argv = originalArgv;
    });

    it('Uses sensible config value defaults when not overriden', () => {
        // Act
        const config = require('../config')();

        // Assert
        expect(config).to.contain({
            'egar-workflow-api-url': 'http://workflow-api-proxy:8010/api/v1',
            'submission-poll-timeout': 5000,
            'submission-poll-frequency': 1000,
            'max-submission-polls': 10
        });
    });

    it('Allows any config variable to be overriden by application arguments', () => {
        // Assign
        const argConfig = {
            'egar-workflow-api-url': 'http://wf-api-proxy:8011/api/v1',
            'submission-poll-timeout': 2000,
            'submission-poll-frequency': 500,
            'max-submission-polls': 5
        };

        Object.keys(argConfig).forEach(key => {
            process.argv.push(`--${key}=${argConfig[key]}`);
        });

        // Act
        const config = require('../config')();

        // Assert
        expect(config).to.contain(argConfig);
    });

    it('Will not validate if the egar-workflow-api-url is unspecified', () => {
        // Assign
        const argConfig = {
            'egar-workflow-api-url': ''
        };

        Object.keys(argConfig).forEach(key => {
            process.argv.push(`--${key}=${argConfig[key]}`);
        });
        const config = require('../config')(stubLogger);
        mock(stubLogger).expects('error').calledWith('Required config setting \'egar-workflow-api-url\' not provided.');

        // Act + Assert
        expect(config.validate()).to.be.false;
        mock.verify();
    });

    it('Validates if the egar-workflow-api-url is specified', () => {
        // Assign
        const config = require('../config')(stubLogger);
        mock(stubLogger).expects('error').never();

        // Act + Assert
        expect(config.validate()).to.be.true;
        mock.verify();
    });
});
