'use strict';
const _ = require('lodash');
const iataCodes = require('../assets/json/iata');

/**
 * Responds to /search/iata with found IATA codes if the search term is two letters or longer,
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

    if (searchTerm && searchTerm.length > 1 && iataCodes[searchTerm[0]]) {
        response.options = _.filter(iataCodes[searchTerm[0]], c => c.toUpperCase().startsWith(searchTerm));
    }

    res.send(JSON.stringify(response));
};

module.exports = {
    uri: '/search/iata',
    handler: handler
};
