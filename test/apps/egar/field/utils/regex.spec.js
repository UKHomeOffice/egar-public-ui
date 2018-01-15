'use strict';

const _ = require('lodash');
const describe = require('mocha').describe;
const it = require('mocha').it;
const expect = require('chai').expect;

const regex = require('../../../../../apps/egar/fields/utils').regex;

describe('Validation Regexes', () => {
    describe('Latitude', () => {
        it('Matches S8959 <-> N0000 <-> N8959', () => {
            // Assert
            for (let degree = 0; degree <= 89; degree++) {
                for (let minute = 0; minute <= 59; minute++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let minuteString = _.padStart(minute.toString(), 2, '0');

                    expect(`N${degreeString}${minuteString}`.match(regex.latitude)[0])
                        .to.equal(`N${degreeString}${minuteString}`);
                    expect(`S${degreeString}${minuteString}`.match(regex.latitude)[0])
                        .to.equal(`S${degreeString}${minuteString}`);
                }
            }
        });

        it('Matches S9000/N9000', () => {
            // Assert
            expect('N9000'.match(regex.latitude)[0]).to.equal('N9000');
            expect('S9000'.match(regex.latitude)[0]).to.equal('S9000');
        });

        it('Does not match 0000 <-> 9000', () => {
            // Assert
            for (let degree = 0; degree <= 89; degree++) {
                for (let minute = 0; minute <= 59; minute++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let minuteString = _.padStart(minute.toString(), 2, '0');

                    expect(`${degreeString}${minuteString}`.match(regex.latitude)).to.be.null;
                }
            }
        });

        it('Does not match degrees + minutes over 90', () => {
            // Assert +90.01/90.01/-90.01 - +90.99/90.99/-90.99 don't match
            let degree = 90;
            for (let minute = 1; minute <= 59; minute++) {
                let degreeString = _.padStart(degree.toString(), 2, '0');
                let minuteString = _.padStart(minute.toString(), 2, '0');

                expect(`${degreeString}${minuteString}`.match(regex.latitude)).to.be.null;
            }

            expect('N9100'.match(regex.latitude)).to.be.null;
        });

        it('Does not match seconds over 59', () => {
            // Assert
            expect('N0060'.match(regex.latitude)).to.be.null;
        });

        it('Matches -89.99 <-> 00.00 <-> +89.99', () => {
            // Assert
            for (let degree = 0; degree <= 89; degree++) {
                for (let percent = 0; percent <= 99; percent++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let percentString = _.padStart(percent.toString(), 2, '0');

                    expect(`+${degreeString}.${percentString}`.match(regex.latitude)[0])
                        .to.equal(`+${degreeString}.${percentString}`);
                    expect(`-${degreeString}.${percentString}`.match(regex.latitude)[0])
                        .to.equal(`-${degreeString}.${percentString}`);
                    expect(`${degreeString}.${percentString}`.match(regex.latitude)[0])
                        .to.equal(`${degreeString}.${percentString}`);
                }
            }
        });

        it('Matches -90.00/90.00/+90.00', () => {
            // Assert
            expect('+90.00'.match(regex.latitude)[0]).to.equal('+90.00');
            expect('-90.00'.match(regex.latitude)[0]).to.equal('-90.00');
            expect('90.00'.match(regex.latitude)[0]).to.equal('90.00');
        });

        it('Does not match degrees + percent over/under 90', () => {
            // Assert N9001 - N9059 and N9100 don't match
            let degree = 90;
            for (let percent = 1; percent <= 99; percent++) {
                let degreeString = _.padStart(degree.toString(), 2, '0');
                let percentString = _.padStart(percent.toString(), 2, '0');

                expect(`+${degreeString}.${percentString}`.match(regex.latitude)).to.be.null;
                expect(`-${degreeString}.${percentString}`.match(regex.latitude)).to.be.null;
                expect(`${degreeString}.${percentString}`.match(regex.latitude)).to.be.null;
            }

            expect('+91.00'.match(regex.latitude)).to.be.null;
            expect('-91.00'.match(regex.latitude)).to.be.null;
            expect('91.00'.match(regex.latitude)).to.be.null;
        });
    });

    describe('Longitude', () => {
        it('Matches E17959 <-> W0000 <-> W17959', () => {
            // Assert
            for (let degree = 0; degree <= 179; degree++) {
                for (let minute = 0; minute <= 59; minute++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let minuteString = _.padStart(minute.toString(), 2, '0');

                    expect(`E${degreeString}${minuteString}`.match(regex.longitude)[0])
                        .to.equal(`E${degreeString}${minuteString}`);
                    expect(`W${degreeString}${minuteString}`.match(regex.longitude)[0])
                        .to.equal(`W${degreeString}${minuteString}`);
                }
            }
        });

        it('Matches E18000/W18000', () => {
            // Assert
            expect('E18000'.match(regex.longitude)[0]).to.equal('E18000');
            expect('W18000'.match(regex.longitude)[0]).to.equal('W18000');
        });

        it('Does not match 0000 <-> 17959', () => {
            // Assert
            for (let degree = 0; degree <= 179; degree++) {
                for (let minute = 0; minute <= 59; minute++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let minuteString = _.padStart(minute.toString(), 2, '0');

                    expect(`${degreeString}${minuteString}`.match(regex.longitude)).to.be.null;
                }
            }
        });

        it('Does not match degrees + minutes over 180', () => {
            // Assert W18001 - W18059 and W18100 don't match
            let degree = 180;
            for (let minute = 1; minute <= 59; minute++) {
                let degreeString = _.padStart(degree.toString(), 2, '0');
                let minuteString = _.padStart(minute.toString(), 2, '0');

                expect(`${degreeString}${minuteString}`.match(regex.longitude)).to.be.null;
            }

            expect('W18100'.match(regex.longitude)).to.be.null;
        });

        it('Does not match seconds over 59', () => {
            // Assert
            expect('E0060'.match(regex.longitude)).to.be.null;
        });

        it('Matches -179.99 <-> 00.00 <-> +179.99', () => {
            // Assert
            for (let degree = 0; degree <= 179; degree++) {
                for (let percent = 0; percent <= 99; percent++) {
                    let degreeString = _.padStart(degree.toString(), 2, '0');
                    let percentString = _.padStart(percent.toString(), 2, '0');

                    expect(`+${degreeString}.${percentString}`.match(regex.longitude)[0])
                        .to.equal(`+${degreeString}.${percentString}`);
                    expect(`-${degreeString}.${percentString}`.match(regex.longitude)[0])
                        .to.equal(`-${degreeString}.${percentString}`);
                    expect(`${degreeString}.${percentString}`.match(regex.longitude)[0])
                        .to.equal(`${degreeString}.${percentString}`);
                }
            }
        });

        it('Matches -180.00/180.00/+180.00', () => {
            // Assert
            expect('+180.00'.match(regex.longitude)[0]).to.equal('+180.00');
            expect('-180.00'.match(regex.longitude)[0]).to.equal('-180.00');
            expect('180.00'.match(regex.longitude)[0]).to.equal('180.00');
        });

        it('Does not match degrees + percent over/under 180', () => {
            // Assert +180.01/180.01/-180.01 - +180.99/180.99/-180.99 don't match
            let degree = 180;
            for (let percent = 1; percent <= 99; percent++) {
                let degreeString = _.padStart(degree.toString(), 2, '0');
                let percentString = _.padStart(percent.toString(), 2, '0');

                expect(`+${degreeString}.${percentString}`.match(regex.longitude)).to.be.null;
                expect(`-${degreeString}.${percentString}`.match(regex.longitude)).to.be.null;
                expect(`${degreeString}.${percentString}`.match(regex.longitude)).to.be.null;
            }

            expect('+181.00'.match(regex.longitude)).to.be.null;
            expect('-181.00'.match(regex.longitude)).to.be.null;
            expect('181.00'.match(regex.longitude)).to.be.null;
        });
    });
});
