'use strict';

const glob = require('glob');
const path = require('path');

const icaoCodes = {
    isValidCode: value => {
        return (value === '' || (icaoCodes[value[0]] && icaoCodes[value[0]].indexOf(value) >= 0));
    }
};

glob.sync(`${__dirname}/*.json`).forEach(file => {
    icaoCodes[file.match(/icao_(.){1}/)[1]] = require(path.resolve(file));
});

module.exports = icaoCodes;
