'use strict';

const hof = require('hof');

const settings = require('./hof.settings');

settings.routes = settings.routes.map(route => require(route));
settings.root = __dirname;
settings.start = false;

module.exports = hof(settings);

// module.exports should be the app object, returned from hof/lib/settings
// => should be able to add checksession for whether user is logged it or not
// /home/egar/egar-public-ui/apps/egar-public-egar-ui/
