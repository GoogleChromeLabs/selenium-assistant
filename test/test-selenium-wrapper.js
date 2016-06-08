/*
  Copyright 2016 Google Inc. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

'use strict';

require('chai').should();
const sinon = require('sinon');

const sinonStubs = [];

describe('SeleniumWrapper', function() {
  const seleniumWrapper = require('../src/index.js');

  afterEach(function() {
    while (sinonStubs.length > 0) {
      const stub = sinonStubs.pop();
      stub.restore();
    }
  });

  it('should be instantiated', function() {
    (typeof seleniumWrapper !== 'undefined').should.equal(true);
  });

  it('should be able to get an array of available browsers', function() {
    const browsers = seleniumWrapper.getAvailableBrowsers();
    (browsers instanceof Array).should.equal(true);
  });

  it('should return only valid browsers in available browsers', function() {
    const browsers = seleniumWrapper.getAvailableBrowsers();
    browsers.forEach(browser => {
      browser.isValid().should.equal(true);
    });
  });

  it('should be able to print available browsers', function() {
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

  it('should handle undefined in killWebDriver()', function() {
    const killPromise = seleniumWrapper.killWebDriver();
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should handle null in killWebDriver()', function() {
    const killPromise = seleniumWrapper.killWebDriver(null);
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should throw an error on an object without a quit function', function() {
    const killPromise = seleniumWrapper.killWebDriver({});
    (killPromise instanceof Promise).should.equal(true);
    return killPromise.then(() => {
      throw new Error('Expected to throw error');
    }, () => {
      // NOOP, this should throw
    });
  });

  it('should resolve when a driver with quit method is injected', function() {
    // Driver quit waits 2 seconds for driver to completely finish
    this.timeout(3000);

    const killPromise = seleniumWrapper.killWebDriver({
      quit: () => {
        var fakePromise = {
          then: cb => {
            cb();
            return fakePromise;
          },
          thenCatch: () => {
            return fakePromise;
          }
        };

        return fakePromise;
      }
    });
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should resolve when a driver with quit method that rejects is injected', function() {
    // Driver quit waits 2 seconds for driver to completely finish
    this.timeout(3000);

    const killPromise = seleniumWrapper.killWebDriver({
      quit: () => {
        var fakePromise = {
          then: () => {
            return fakePromise;
          },
          thenCatch: cb => {
            cb();
            return fakePromise;
          }
        };

        return fakePromise;
      }
    });
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });
});
