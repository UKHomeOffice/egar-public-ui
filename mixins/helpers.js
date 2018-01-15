'use strict';

const Hogan = require('hogan.js');
const _ = require('lodash');

module.exports = (req, res) => {
    class Helpers {
        transalate(key) {
            return this.render(req.translate(key), this);
        }

        // Like t() but returns null on failed translations
        conditionalTranslate(key) {
            const translated = req.translate(key);
            return translated !== key ? translated : null;
        }

        getTranslationKey(field, key, property) {
            return field[property] ? field[property] : 'fields.' + key + '.' + property;
        }

        isRequired(field) {
            if (field.required !== undefined) {
              return field.required;
            } else if (field.validate) {
              return field.validate.indexOf('required') > -1;
            }
            return false;
        }

        maxlength(field) {
            const validation = field.validate || [];
            const ml = _.find(validation, t => t.type === 'maxlength') ||
                        _.find(validation, t => t.type === 'exactlength');
            if (ml) {
              return _.isArray(ml.arguments) ? ml.arguments[0] : ml.arguments;
            }
            return null;
        }

        type(field) {
            return field.type || 'text';
        }

        classNameString(name) {
            if (_.isArray(name)) {
              return name.join(' ');
            }
            return name;
        }

        classNames(field, prop) {
            prop = prop || 'className';
            if (field[prop]) {
                return this.classNameString(field[prop]);
            }
            return '';
        }

        render(text, ctx) {
            if (!text) {
                return '';
            }
            ctx = Object.assign({}, res.locals, ctx);
            return Hogan.compile(text).render(ctx);
        }
    }

    return new Helpers();
};
