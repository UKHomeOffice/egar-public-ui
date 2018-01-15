'use strict';

module.exports = {
    mixin: require('./lib/autocomplete').mixin,
    middleware: require('./lib/autocomplete').middleware,
    js: require('./assets/js')
};
