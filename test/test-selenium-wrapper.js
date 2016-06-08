'use strict';

require('chai').should();
const sinon = require('sinon');

const sinonStubs = [];

describe('SeleniumWrapper', function() {
  afterEach(function() {
    while (sinonStubs.length > 0) {
      const stub = sinonStubs.pop();
      stub.restore();
    }
  });

  it('should be instantiated', function() {
    const seleniumWrapper = require('../src/index.js');
    (typeof seleniumWrapper !== 'undefined').should.equal(true);
  });

  it('should be able to get an array of available browsers', function() {
    const seleniumWrapper = require('../src/index.js');
    const browsers = seleniumWrapper.getAvailableBrowsers();
    (browsers instanceof Array).should.equal(true);
  });

  it('should return only valid browsers in available browsers', function() {
    const seleniumWrapper = require('../src/index.js');
    const browsers = seleniumWrapper.getAvailableBrowsers();
    browsers.forEach(browser => {
      browser.isValid().should.equal(true);
    });
  });

  it('should be able to print available browsers', function() {
    const seleniumWrapper = require('../src/index.js');

    let consoleCalls = 0;
    const stub = sinon.stub(console, 'log', () => {
      consoleCalls++;
    });
    sinonStubs.push(stub);

    // Console Test
    const output = seleniumWrapper.printAvailableBrowserInfo();

    stub.restore();

    (typeof output).should.equal('string');
    consoleCalls.should.equal(1);
  });

  it('should not print table to console', function() {
    const seleniumWrapper = require('../src/index.js');

    let consoleCalls = 0;
    const stub = sinon.stub(console, 'log', () => {
      consoleCalls++;
    });
    sinonStubs.push(stub);

    // Console Test
    const output = seleniumWrapper.printAvailableBrowserInfo(false);

    stub.restore();

    (typeof output).should.equal('string');
    consoleCalls.should.equal(0);
  });
});
