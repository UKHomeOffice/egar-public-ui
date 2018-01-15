'use strict';

const _ = require('lodash');
const path = require('path');

const fs = require('fs');
const Hogan = require('hogan.js');
const TEMPLATE = path.resolve(__dirname, '../templates/autocomplete.html');

/**
 * Gets the values required to render the autocomplete template
 * @param {http.IncomingMessage} req The request for the page that contains the autocomplete
 * @param {http.ServerResponse} res The response that will be sent to the browser
 * @param {String} id The id of the element to be enhanced by the autocomplete field
 * @param {Object} [options] Field configuration options
 */
const getRenderValues = (req, res, id, options) => {
    options = options || {};

    const helpers = require('../../helpers')(req, res);
    const fieldOptions = req.form.options.fields[id] || options[id];
    const hKey = helpers.getTranslationKey(fieldOptions, id, 'hint');
    const lKey = helpers.getTranslationKey(fieldOptions, id, 'label');
    const hint = helpers.conditionalTranslate(hKey);
    const required = helpers.isRequired(fieldOptions);
    const autocomplete = fieldOptions.autocomplete;
    const fallback = fieldOptions.fallback || 'text';
    const type = fieldOptions.type || 'text';

    const renderValues = {
        id,
        className: fieldOptions.className,
        value: res.locals.values[id],
        label: helpers.transalate(lKey),
        labelClassName: helpers.classNames(fieldOptions, 'labelClassName') || 'form-label',
        hint: hint,
        hintId: hint ? id + '-hint' : null,
        error: req.form.errors && req.form.errors[id],
        maxlength: helpers.maxlength(fieldOptions),
        required: required,
        autocomplete: autocomplete,
        attributes: fieldOptions.attributes,
        searchUri: fieldOptions.searchUri,
        minSearchLength: fieldOptions.minSearchLength || 0,
        fallbackSelect: fallback === 'select',
        fallbackTextbox: fallback === 'text',
        showAllValues: fieldOptions.showAllValues,
        options: fieldOptions.options ? fieldOptions.options.map(opt => {
            return {
                label: opt.label,
                value: opt.value,
                selected: opt.value === res.locals.values[id]
            };
        }) : [],
        type: type,
        pattern: fieldOptions.pattern
    };

    return renderValues;
};

module.exports = {
    mixin: (id, options) => {
        if (!id) {
            throw new Error('Element id must be passed to the autocomplete component');
        }
        options = _.defaultsDeep({}, options);

        const template = options.template ?
            path.resolve(__dirname, options.template) :
            TEMPLATE;

        // render the template to a string, assign the html output
        // to the time field in res.locals.fields
        const preRender = (req, res, next) => {
            res.render(template, getRenderValues(req, res, id, options), (err, html) => {
                if (err) {
                    next(err);
                } else {
                    const field = res.locals.fields.find(f => f.key === id);
                    Object.assign(field, { html });
                    next();
                }
            });
        };

        // return config extended with hooks
        return Object.assign({}, options, {
            hooks: {
                'pre-render': preRender
            }
        });
    },
    middleware: (req, res, next) => {
        res.locals.autocomplete = () => {
            // Return a named function to allow scope (`this`) to be assigned
            // `this` will be the field locals
            return function renderAutocomplete(key) {
                const id = Hogan.compile(key).render(this);

                const compiledTemplate = Hogan.compile(fs.readFileSync(TEMPLATE).toString());
                const renderValues = getRenderValues(req, res, id);

                return compiledTemplate.render(renderValues);
            };
        };
        next();
    }
};
