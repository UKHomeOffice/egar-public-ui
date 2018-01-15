'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const Hogan = require('hogan.js');
const PANELMIXIN = 'partials/mixins/panel';

const TEMPLATE = path.resolve(__dirname, '../templates/text-expander.html');

const conditionalTranslate = (key, translate) => {
  let result = translate(key);
  if (result === key) {
    result = null;
  }
  return result;
};

module.exports = (key, options) => {
  if (!key) {
    throw new Error('Key must be passed to the text-expander component');
  }
  options = options || {};
  const templateCache = {};

  const template = options.template ?
    path.resolve(__dirname, options.template) :
    TEMPLATE;

  // render the template to a string, assign the html output
  // to the expander field in res.locals.fields
  const preRender = (req, res, next) => {

    function readTemplate(name) {
      if (templateCache[name]) {
        return templateCache[name];
      }
      const data = fs.readFileSync(`${name}.html`).toString();
      templateCache[name] = data;
      return data;
    }

    function renderMixin() {
      return () => {
        if (this.child) {
          if (this.child === 'html') {
            try {
              const keyH = this.toggle;
              return res.locals.fields.find((field) => {
                return field.keyH === keyH;
              }).html;
            } catch (err) {
              const msg = `html property not set on field: ${this.toggle}. Did you forget to use a component?`;
              next(new Error(msg));
            }
          }
          if (this[this.child]) {
            return this[this.child]().call(this, this.toggle);
          }
        }
      };
    }

    function getTemplate(child) {
      res.locals.partials = res.locals.partials || {};


      const re = /^partials\/(.+)/i;
      const match = child.match(re);

      if (match) {
        return readTemplate(res.locals.partials['partials-' + match[1]]);
      } else if (child === 'html' || res.locals[child]) {
        if (res.locals.partials['partials-mixins-panel']) {
          return readTemplate(res.locals.partials['partials-mixins-panel']);
        }
        const panelPath = path.join(options.viewsDirectory, PANELMIXIN);
        return readTemplate(panelPath);

      }
      return child;

    }

    function renderChild() {
      return () => {
        if (this.child) {
          const templateString = getTemplate(this.child, this.toggle);
          const templateH = Hogan.compile(templateString);
          return templateH.render(Object.assign({
            renderMixin: renderMixin.bind(this)
          }, res.locals, this), _.map(res.locals.partials, (partialpath) => {
            return readTemplate(partialpath);
          }));
        }
      };
    }

    const field = res.locals.fields.find(f => f.key === key);
    Object.assign(this, {
      key: key,
      field: field,
      child: field.options ? field.options[0].child : null,
      toggle: field.options ? field.options[0].toggle : null
    });

    const value = field.options ? field.options[0].value : null;

    const renderValues = {
      summary: conditionalTranslate(`fields.${key}.summary`, req.translate),
      details: conditionalTranslate(`fields.${key}.details`, req.translate),
      value: req.form.values[value] ? 'open' : '',
      renderChild: renderChild.bind(this)
    };

    res.render(template, renderValues, (err, html) => {
      if (err) {
        next(err);
      } else {
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
};
