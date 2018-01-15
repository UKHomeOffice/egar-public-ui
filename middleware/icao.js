'use strict';
const _ = require('lodash');
const icaoCodes = require('../assets/json/icao');

/**
 * Responds to /search/icao with found ICAO codes if the search term is two letters or longer,
 * or no results if the search term is shorter.
 * @param {http.IncomingMessage} req The GET request
 * @param {http.ServerResponse} res The response that will be sent to the browser
 */
const handler = (req, res) => {
    let searchTerm = req.query.code;
    searchTerm = searchTerm ? searchTerm.toUpperCase() : searchTerm;

    let response = {
        options: []
    };

    if (searchTerm && searchTerm.length > 1 && icaoCodes[searchTerm[0]]) {
        response.options = _.filter(icaoCodes[searchTerm[0]], c => c.toUpperCase().startsWith(searchTerm));
    }

    res.send(JSON.stringify(response));
};

module.exports = {
    uri: '/search/icao',
    handler: handler
};
