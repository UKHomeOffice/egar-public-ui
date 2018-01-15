'use strict';

module.exports = [
    require('./icao'),
    require('./iata'),
    require('./file-upload')
].concat(require('../mixins').middleware);
