'use strict';
/**
 * A helper module to instantiate behaviours for test
 */

const FormController = require('hof-form-controller');
const mix = require('mixwith').mix;
const spy = require('sinon').spy;

const stubLog = {
    error: spy(),
    warn: spy(),
    info: spy(),
    debug: spy(),
    verbose: spy()
};

const fixBackLink = spy();

const stubBase = Base => class extends Base {
    constructor(options) {
        super(options);
        this.log = stubLog;
        this.fixBackLink = fixBackLink;
    }
};

const base = mix(FormController);

module.exports = behaviour => class extends base.with.apply(base, [stubBase, behaviour]) { };

module.exports.StubLog = stubLog;
