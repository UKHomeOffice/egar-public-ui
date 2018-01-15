'use strict';
const textExpander = require('../../../mixins').textExpander;

module.exports = {
    'egar-supporting-files-expander': textExpander('egar-supporting-files-expander'),
    'egar-supporting-files': {
        mixin: 'radio-group',
        className: 'inline',
        legend: {
            className: 'visuallyhidden'
        },
        options: ['true', 'false']
    }
};
