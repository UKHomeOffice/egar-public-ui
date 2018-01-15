'use strict';

module.exports = {
    'egar-aircraft-registration': {
        mixin: 'input-text',
        validate: ['alphanum', {type: 'maxlength', arguments: 15 }]
    },
    'egar-aircraft-type': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 35 }]
    },
    'egar-aircraft-base': {
        mixin: 'input-text',
        validate: [{type: 'maxlength', arguments: 200 }]
    },
    'egar-aircraft-taxes-paid': {
        mixin: 'radio-group',
        className: 'inline',
        options: ['true', 'false']
    }
};
