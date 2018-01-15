#!/usr/bin/env node
'use strict';

/**
 * hof-build doesn't expose settings for browserify to allow babelify transform
 * to be introduced, so this lib replicates the work done there and adds babelify
 */
const path = require('path');
const _ = require('lodash');

const config = {
    browserify: {
        src: 'assets/js/index.js',
        out: 'public/js/bundle.js',
        match: 'assets/js/**/*.js',
        restart: false,
        compress: false
    }
};

const build = options => {

    const settings = {};

    _.merge(settings, config);

    // load settings from ./hof.settings.json if it exists
    let localConfig;
    let hofSettings;
    try {
        localConfig = path.resolve(process.cwd(), './hof.settings');
        hofSettings = require(localConfig).build || {};
        hofSettings.theme = require(localConfig).theme;
    } catch (e) {
        // ignore error for missing config file
    }

    if (hofSettings) {
        /* eslint-disable no-console*/
        console.log(`Found local config at ${localConfig}`);
        /* eslint-enable no-console*/
        _.merge(settings, hofSettings);
    }

    // load override config file if defined
    if (options.config) {
        _.merge(settings, require(path.resolve(process.cwd(), options.config)));
    }

    /* eslint-disable no-process-env*/
    settings.production = options.production || process.env.NODE_ENV === 'production';
    settings.watchNodeModules = options['watch-node-modules'];
    settings.watchDotFiles = options['watch-dotfiles'];
    settings.verbose = options.verbose;
    /* eslint-enable no-process-env*/

    return require('./babelify/index')(settings);
};

/* eslint-disable no-process-exit, no-console*/
/* eslint-disable  implicit-dependencies/no-implicit */
const options = require('minimist')(process.argv.slice(2));
build(options)
    .catch(e => {
        console.error(e.stack);
        process.exit(1);
    });
/* eslint-enable */
