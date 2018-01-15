'use strict';

const glob = require('glob');
const path = require('path');

const iataCodes = {
    isValidCode: value => {
        return (value === '' || (iataCodes[value[0]] && iataCodes[value[0]].indexOf(value) >= 0));
    }
};

glob.sync(`${__dirname}/*.json`).forEach(file => {
    iataCodes[file.match(/iata_(.){1}/)[1]] = require(path.resolve(file));
});

module.exports = iataCodes;
