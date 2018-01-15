'use strict';

module.exports = {
    autocomplete: require('./egar-component-autocomplete'),
    textExpander: require('./egar-component-text-expander'),
    time: require('./egar-component-time'),
    middleware: [{
        handler: require('./egar-component-autocomplete').middleware
    }]
};


