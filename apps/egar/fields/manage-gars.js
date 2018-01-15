'use strict';

const date = require('hof-component-date');

module.exports = {
        'egar-manage-gars-date-from': date('egar-manage-gars-date-from', {
        mixin: 'input-date',
        className: 'inline'
    }),
    'egar-manage-gars-date-to': date('egar-manage-gars-date-to', {
        mixin: 'input-date',
        className: 'inline'
    })
};
