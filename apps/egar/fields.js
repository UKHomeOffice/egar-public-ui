'use strict';

const _ = require('lodash');

module.exports = _.extend(
    require('./fields/aircraft'),
    require('./fields/departure'),
    require('./fields/arrival'),
    require('./fields/goods'),
    require('./fields/person'),
    require('./fields/supporting-files'),
    require('./fields/upload-files'),
    require('./fields/upload-file-ok'),
    require('./fields/manage-gars')
);
