'use strict';

const _ = require('lodash');
const hof = require('hof');
const helmet = require('helmet');
const path = require('path');
const Logger = require('./logger');
const settings = require('./hof.settings');
const packageConfig = require('./package.json');

const log = Logger(settings);

const BaseController = require('./apps/base-controller');
const config = require('./config')(log);
const egarMiddleware = require('./middleware');
const egarRequest = require('./apps/egar/services/request-promise-egar');
const egarApp = require('./apps/egar');


settings.routes = settings.routes.map(route => require(route));
settings.root = __dirname;
settings.start = false;
settings.behaviours = BaseController;
settings.csp = {
    /* eslint-disable quotes */
    connectSrc: ["'self'"]
    /* eslint-enable quotes */
};

settings.views = path.resolve(__dirname, './views');
settings.middleware = [helmet.noCache()];

var app = hof(settings);

if (!config.validate()) {
    /* eslint-disable no-console, no-process-exit*/
    log.error('Invalid config, exiting');
    process.exit(1);
    /* eslint-enable no-console, no-process-exit*/
}

app.use(function re(req, res, next) {
    const egarAppSession = _.at(req, 'session.hof-wizard-egar')[0];

    // EGAR is not a straight front-to-back wizard
    // Pre-populate the steps so that pages can be visited out of order
    if (egarAppSession) {
        egarAppSession.steps = Object.keys(egarApp.steps);
    } else if (req.url.indexOf('egar') > 0 && !req.session.firstEgarUrl) {
        req.session.firstEgarUrl = req.url;
    }

    next();
});

app.use('/version', (req, res) => {
    const baseUrl = config['egar-workflow-version-url'];
    let options = {
        uri: baseUrl,
        json: true
    };
    egarRequest(options, req).then(response => {
        const versions = [];
        const apis = Object.keys(response);


        versions.push(`UI: ${packageConfig.version}`);
        apis.forEach(k => {
            if (k === 'AttributeClient') {
                return;
            }

            let version = '';

            if (response[k] && response[k].version) {
                version = response[k].version;
            }

            versions.push(`${k === 'app' ? 'Workflow API' : k.replace('Client', ' Client')}: ` +
                `${version ? version : JSON.stringify(response[k])}`);
        });

        res.write(versions.join('\n'));
        log.debug(response);
        res.end();
    }, err => {
        log.error(err);
        res.write('An error occurred whilst retrieving the version information.');
        res.end();
    });

});

_.each(egarMiddleware, m => {
    if (m.uri && m.handler) {
        app.use(m.uri, m.handler);
    } else if (m.handler) {
        app.use(m.handler);
    }
});

app.start();
