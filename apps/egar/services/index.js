'use strict';

const location = require('./location');

module.exports = {
    AircraftService: require('./aircraft'),
    AttributesService: require('./attributes'),
    GarService: require('./gar'),
    Location: location.Location,
    LocationService: location.LocationService,
    PersonService: require('./person'),
    SubmitService: require('./submit'),
    FileService: require('./file')
};
