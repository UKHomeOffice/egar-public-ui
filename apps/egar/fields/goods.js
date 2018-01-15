'use strict';
const textExpander = require('../../../mixins').textExpander;

module.exports = {
    'egar-goods-expander': textExpander('egar-goods-expander'),
    'egar-goods-declaration': {
        mixin: 'radio-group',
        className: 'inline',
        legend: {
            className: 'visuallyhidden'
        },
        options: ['true', 'false']
    }
};
