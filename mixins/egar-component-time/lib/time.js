'use strict';

const _ = require('lodash');
const path = require('path');
const getFields = require('./fields');

const TEMPLATE = path.resolve(__dirname, '../templates/time.html');

// utility function taking the req.body, fields and key,
// returns a map of values in the format:
// {
//   second: '01',
//   minute: '01',
//   hour: '12'
// }
const getParts = (body, fields, key) =>
  _.mapKeys(_.pick(body, Object.keys(fields)), (value, fieldKey) =>
    fieldKey.replace(`${key}-`, '')
  );

// accepts a time value in the format HH:MM:SS and fields config,
// returns a map of key: value pairs for the intermedate fields
const getPartsFromTime = (time, fields) =>
  time.split(':')
    .slice()
    .reduce((obj, value, index) => Object.assign({}, obj, {
      [fields[index]]: value
    }), {});

// preprend '0' if number is only a single digit
const pad = num => _.trim(num) !== '' && num.length < 2 ? `0${_.trim(num)}` : _.trim(num);

const conditionalTranslate = (key, translate) => {
  let result = translate(key);
  if (result === key) {
    result = null;
  }
  return result;
};

const getLegendClassName = field => {
  return field && field.legend && field.legend.className || '';
};

module.exports = (key, options) => {
  if (!key) {
    throw new Error('Key must be passed to the time component');
  }
  options = _.defaultsDeep({}, options, {
    minutesOptional: false,
    secondsOptional: true,
    hour: {
      min: 0,
      max: 23,
      maxLength: 2,
      pattern: '[0-9]*'
    },
    minute: {
      min: 0,
      max: 59,
      maxLength: 2,
      pattern: '[0-9]*'
    },
    second: {
      min: 0,
      max: 59,
      maxLength: 2,
      pattern: '[0-9]*'
    }
  });

  // validates 24hr time format or null entry
  options.validate = [{type: 'regex', arguments: '([0-1]{1}[0-9]{1}|20|21|22|23):[0-5]{1}[0-9]{1}:00|^$'}];

  const template = options.template ?
    path.resolve(__dirname, options.template) :
    TEMPLATE;
  const fields = getFields(key);
  const minutesOptional = !!options.minutesOptional;
  const secondsOptional = minutesOptional || !!options.secondsOptional;

  // if time field is included in errorValues, extend
  // errorValues with the individual components
  const preGetErrors = (req, res, next) => {
    const errorValues = req.sessionModel.get('errorValues');
    if (errorValues && errorValues[key]) {
      req.sessionModel.set('errorValues',
        Object.assign({}, errorValues, getPartsFromTime(errorValues[key], Object.keys(fields)))
      );
    }
    next();
  };

  // if time field has any validation error, also add errors
  // for the three child components. null type as we don't want to show
  // duplicate messages
  const postGetErrors = (req, res, next) => {
    const errors = req.sessionModel.get('errors');
    if (errors && errors[key]) {
      Object.assign(req.form.errors, Object.keys(fields).reduce((obj, field) =>
        Object.assign({}, obj, { [field]: { type: null } })
      , {}));
    }
    next();
  };

  // if time value is set, split its parts and assign to req.form.values.
  // This is extended with errorValues if they are present
  const postGetValues = (req, res, next) => {
    const time = req.form.values[key];
    if (time) {
      Object.assign(
        req.form.values,
        getPartsFromTime(time, Object.keys(fields)),
        req.sessionModel.get('errorValues') || {}
      );
    }
    next();
  };

  // render the template to a string, assign the html output
  // to the time field in res.locals.fields
  const preRender = (req, res, next) => {
    Object.assign(req.form.options.fields, _.mapValues(fields, (v, k) => {
      const rawKey = k.replace(`${key}-`, '');
      const labelKey = `fields.${key}.parts.${rawKey}`;
      const label = req.translate(labelKey);
      return Object.assign({}, v, {
        label: label === labelKey ? v.label : label
      });
    }));

    const renderValues = {
      key,
      legend: conditionalTranslate(`fields.${key}.legend`, req.translate),
      legendClassName: getLegendClassName(options),
      hint: conditionalTranslate(`fields.${key}.hint`, req.translate),
      error: req.form.errors && req.form.errors[key],
      hour: _.assign({
        label: req.form.options.fields[`${key}-hour`].label,
        value: req.form.values[`${key}-hour`]
      }, options.hour),
      minute: _.assign({
        label: req.form.options.fields[`${key}-minute`].label,
        value: req.form.values[`${key}-minute`]
      }, options.minute),
      second: _.assign({
        label: req.form.options.fields[`${key}-second`].label,
        value: req.form.values[`${key}-second`]
      }, options.second),
      minutesRequired: !minutesOptional,
      secondsRequired: !secondsOptional
    };

    res.render(template, renderValues, (err, html) => {
      if (err) {
        next(err);
      } else {
        const field = res.locals.fields.find(f => f.key === key);
        Object.assign(field, { html });
        next();
      }
    });
  };

  // take the 3 time parts, padding or defaulting
  // to '01' if applicable, then create a date value in the
  // format HH:mm:ss. Save to req.body for processing
  const preProcess = (req, res, next) => {
    const parts = getParts(req.body, fields, key);

    parts.hour = pad(parts.hour);

    if (_.some(parts, part => _.trim(part) !== '')) {
      if (minutesOptional && !parts.minute) {
        parts.minute = '00';
      } else {
        parts.minute = pad(parts.minute);
      }
      if (secondsOptional && !parts.second) {
        parts.second = '00';
      } else {
        parts.second = pad(parts.second);
      }
      req.body[key] = `${parts.hour}:${parts.minute}:${parts.second}`;
    }
    next();
  };

  // return config extended with hooks
  return Object.assign({}, options, {
    hooks: {
      'pre-getErrors': preGetErrors,
      'post-getErrors': postGetErrors,
      'post-getValues': postGetValues,
      'pre-render': preRender,
      'pre-process': preProcess
    }
  });
};
