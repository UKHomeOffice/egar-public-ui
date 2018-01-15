'use strict';

const describe = require('mocha').describe;
const it = require('mocha').it;
const beforeEach = require('mocha').beforeEach;
const afterEach = require('mocha').afterEach;
const expect = require('chai').expect;
const mock = require('sinon').mock;
const stub = require('sinon').stub;
const spy = require('sinon').spy;

const behaviourCreator = require('../../../utils/behaviour-creator');
const Aggregator = behaviourCreator(require('../../../../apps/egar/behaviours').Aggregator);

const testBehaviours = {
    sb1: SubBehaviour1 => class extends SubBehaviour1 {
        constructor(options) {
            super(options);
            this.originalOptions = options;
            this.$className = 'SubBehaviour1';
        }
        configure() { }
        getValues() { }
        locals() { }
        render() { }
        process() { }
        validate() { }
        saveValues() { }
    },
    sb2: SubBehaviour2 => class extends SubBehaviour2 {
        constructor(options) {
            super(options);
            this.originalOptions = options;
            this.$className = 'SubBehaviour2';
        }
        configure() { }
        getValues() { }
        locals() { }
        render() { }
        process() { }
        validate() { }
        saveValues() { }
    },
    sb3: SubBehaviour3 => class extends SubBehaviour3 {
        constructor(options) {
            super(options);
            this.originalOptions = options;
            this.$className = 'SubBehaviour3';
        }
    }
};

describe('Behaviour Aggregator', () => {
    let aggregator;
    let superClass;
    const options = {
        subBehaviours: [testBehaviours.sb1, testBehaviours.sb2],
        otherOption: 'foo'
    };
    const stubRequest = {
        translate: spy()
    };
    const stubResponse = {};

    beforeEach(() => {
        aggregator = new Aggregator(options);
        superClass = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(aggregator)));
    });

    afterEach(() => {
        mock.restore();
    });

    describe('On creation', () => {
        it('Creates Controller instances that mix in its sub-behaviour classes', () => {
            // Assert
            expect(aggregator.behaviours.length).to.equal(2);
            expect(aggregator.behaviours[0].$className).to.equal('SubBehaviour1');
            expect(aggregator.behaviours[1].$className).to.equal('SubBehaviour2');
        });

        it('Configures its sub-behaviours with the options it was configured with ' +
            'minus the sub-behaviours configuration', () => {
                // Assert
                aggregator.behaviours.forEach(b => {
                    expect(b.originalOptions).to.contain({ otherOption: 'foo' });
                    expect(b.originalOptions).to.not.have.property('subBehaviours');
                });
            });

        it('Configures its sub-behaviours with the logger it was configured with', () => {
            // Assert
            aggregator.behaviours.forEach(b => {
                expect(b.log).to.equal(behaviourCreator.StubLog);
            });
        });
    });

    describe('configure', () => {
        beforeEach(() => {
            stub(superClass, 'configure').callsArg(2);
        });

        afterEach(() => {
            superClass.configure.restore();
        });

        it('Calls every sub-behaviour', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err).to.be.undefined;
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('configure').once().withArgs(stubRequest, stubResponse).callsArgOn(2);
            });

            // Act + Assert
            return aggregator.configure(stubRequest, stubResponse, stubNext);
        });

        it('Returns the first error produced by a sub-behaviour, if any', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err.message).to.equal('Err: SubBehaviour1');
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('configure').once().withArgs(stubRequest, stubResponse)
                    .callsArgOnWith(2, null, new Error(`Err: ${b.$className}`));
            });

            // Act + Assert
            return aggregator.configure(stubRequest, stubResponse, stubNext);
        });
    });

    describe('getValues', () => {
        it('Returns a combined set of values from sub-behaviours (first in wins)', (done) => {
            const stubNext = (err, values) => {
                mock.verify();
                expect(err).to.be.null;
                expect(values).to.contain({
                    a: 'a1',
                    b: 'b1',
                    c: 'c2'
                });
                done();
            };

            // Assign
            mock(aggregator.behaviours[0]).expects('getValues').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, null, {
                    a: 'a1',
                    b: 'b1'
                });

            mock(aggregator.behaviours[1]).expects('getValues').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, null, {
                    b: 'b2',
                    c: 'c2'
                });

            // Act + Assert
            return aggregator.getValues(stubRequest, stubResponse, stubNext);
        });

        it('Returns the first error produced by a sub-behaviour, if any', (done) => {
            const stubNext = (err) => {
                mock.verify();
                expect(err.message).to.equal('Err: SubBehaviour2');
                done();
            };

            // Assign
            mock(aggregator.behaviours[0]).expects('getValues').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, null, { a: 'a1' });

            mock(aggregator.behaviours[1]).expects('getValues').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, new Error('Err: SubBehaviour2'), { c: 'c2' });

            // Act + Assert
            return aggregator.getValues(stubRequest, stubResponse, stubNext);
        });

        it('Calls the base functionality if none of the sub-behaviours implement getValues', (done) => {
            const stubNext = (err, values) => {
                mock.verify();
                expect(err).to.be.null;
                expect(values).to.contain({ base: true });
                done();
            };
            aggregator = new Aggregator({ subBehaviours: [testBehaviours.sb3] });


            // Assign
            // The arg at position 2 will be the 'next' callback
            mock(superClass).expects('getValues').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, null, { base: true });


            // Act + Assert
            return aggregator.getValues(stubRequest, stubResponse, stubNext);
        });
    });

    describe('locals', () => {
        it('Returns a combined set of values from sub-behaviours (last in wins)', () => {
            // Assign
            mock(superClass).expects('locals').once().withArgs(stubRequest, stubResponse)
                .returns({
                    base: true
                });

            mock(aggregator.behaviours[0]).expects('locals').once().withArgs(stubRequest, stubResponse)
                .returns({
                    a: 'a1',
                    b: 'b1'
                });

            mock(aggregator.behaviours[1]).expects('locals').once().withArgs(stubRequest, stubResponse)
                .returns({
                    b: 'b2',
                    c: 'c2'
                });

            // Act + Assert
            expect(aggregator.locals(stubRequest, stubResponse)).to.contain({
                a: 'a1',
                b: 'b2',
                base: true
            });
            mock.verify();

        });
    });

    describe('render', () => {
        it('Uses the last sub-behaviour to render the view', () => {
            // Assign
            const stubNext = () => { };

            mock(aggregator.behaviours[0]).expects('render').never();
            mock(aggregator.behaviours[1]).expects('render').once().withArgs(stubRequest, stubResponse, stubNext);

            // Act
            aggregator.render(stubRequest, stubResponse, stubNext);

            // Assert
            mock.verify();
        });
    });

    describe('process', () => {
        it('Calls every sub-behaviour', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err).to.be.undefined;
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('process').once().withArgs(stubRequest, stubResponse).callsArgOn(2);
            });

            // Act + Assert
            return aggregator.process(stubRequest, stubResponse, stubNext);
        });

        it('Returns the first error produced by a sub-behaviour, if any', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err.message).to.equal('Err: SubBehaviour1');
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('process').once().withArgs(stubRequest, stubResponse)
                    .callsArgOnWith(2, null, new Error(`Err: ${b.$className}`));
            });

            // Act + Assert
            return aggregator.process(stubRequest, stubResponse, stubNext);
        });

        it('Does not call the base functionality if none of the sub-behaviours implement process', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err).to.be.undefined;
                done();
            };
            aggregator = new Aggregator({ subBehaviours: [testBehaviours.sb3] });


            // Assign
            // The arg at position 2 will be the 'next' callback
            mock(superClass).expects('process').never();


            // Act + Assert
            return aggregator.process(stubRequest, stubResponse, stubNext);
        });
    });

    describe('validate', () => {
        it('Returns a combined set of errors from sub-behaviours (first in wins)', (done) => {
            const stubNext = (errors) => {
                mock.verify();
                expect(errors).to.contain({
                    err1: 'foo',
                    err2: 'bar'
                });
                done();
            };

            // Assign
            mock(aggregator.behaviours[0]).expects('validate').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, {
                    err1: 'foo'
                });

            mock(aggregator.behaviours[1]).expects('validate').once().withArgs(stubRequest, stubResponse)
                .callsArgOnWith(2, null, {
                    err1: 'baz',
                    err2: 'bar'
                });

            // Act + Assert
            return aggregator.validate(stubRequest, stubResponse, stubNext);
        });

        it('Returns null if no errors are returned from sub-behaviours', (done) => {
            const stubNext = (errors) => {
                mock.verify();
                expect(errors).to.be.null;
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                mock(b).expects('validate').once().withArgs(stubRequest, stubResponse)
                    .callsArgOn(2);
            });

            // Act + Assert
            return aggregator.validate(stubRequest, stubResponse, stubNext);
        });

        it('Does not call the base functionality if none of the sub-behaviours implement validate', (done) => {
            const stubNext = (errors) => {
                mock.verify();
                expect(errors).to.be.null;
                done();
            };
            aggregator = new Aggregator({ subBehaviours: [testBehaviours.sb3] });


            // Assign
            // The arg at position 2 will be the 'next' callback
            mock(superClass).expects('validate').never();


            // Act + Assert
            return aggregator.validate(stubRequest, stubResponse, stubNext);
        });
    });

    describe('saveValues', () => {
        it('Calls every sub-behaviour', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err).to.be.undefined;
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('saveValues').once().withArgs(stubRequest, stubResponse).callsArgOn(2);
            });

            // Act + Assert
            return aggregator.saveValues(stubRequest, stubResponse, stubNext);
        });

        it('Returns the first error produced by a sub-behaviour, if any', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err.message).to.equal('Err: SubBehaviour1');
                done();
            };

            // Assign
            aggregator.behaviours.forEach(b => {
                // The arg at position 2 will be the 'next' callback
                mock(b).expects('saveValues').once().withArgs(stubRequest, stubResponse)
                    .callsArgOnWith(2, null, new Error(`Err: ${b.$className}`));
            });

            // Act + Assert
            return aggregator.saveValues(stubRequest, stubResponse, stubNext);
        });

        it('Does not call the base functionality if none of the sub-behaviours implement saveValue', (done) => {
            const stubNext = err => {
                mock.verify();
                expect(err).to.be.undefined;
                done();
            };
            aggregator = new Aggregator({ subBehaviours: [testBehaviours.sb3] });


            // Assign
            // The arg at position 2 will be the 'next' callback
            mock(superClass).expects('saveValues').never();


            // Act + Assert
            return aggregator.saveValues(stubRequest, stubResponse, stubNext);
        });
    });
});
