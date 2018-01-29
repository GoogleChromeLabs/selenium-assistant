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

const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');

const browserManager = require('../src/browser-manager.js');

require('chai').should();

const NUM_OF_BROWSERS = browserManager.getSupportedBrowsers().length;
const sandbox = sinon.sandbox.create();

describe('SeleniumAssistant', function() {
  const seleniumAssistant = require('../src/index.js');

  afterEach(function() {
    sandbox.restore();
  });

  it('should be instantiated', function() {
    (typeof seleniumAssistant !== 'undefined').should.equal(true);
  });

  it('should be able to get an array of available browsers', function() {
    this.timeout(NUM_OF_BROWSERS * 3000 * 1000);

    const browsers = seleniumAssistant.getLocalBrowsers();
    (browsers instanceof Array).should.equal(true);

    browsers.forEach((browser) => {
      browser.isValid().should.equal(true);
    });
  });

  it('should return a browser for valid browser and release names', function() {
    const possibleBrowsers = ['chrome', 'firefox', 'opera'];
    const releases = ['stable', 'beta', 'unstable'];
    possibleBrowsers.forEach((browserId) => {
      releases.forEach((release) => {
        const browser = seleniumAssistant.getLocalBrowser(browserId, release);
        (typeof browser).should.equal('object');
      });
    });
  });

  it('should throw for an invalid browser name in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser('made-up', 'stable');
    }).to.throw();
  });

  it('should throw for an null browser name in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser(null, 'stable');
    }).to.throw();
  });

  it('should throw for an invalid release name in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser('chrome', 'made-up');
    }).to.throw();
  });

  it('should throw for an null release name in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser('chrome', null);
    }).to.throw();
  });

  it('should throw for no release name in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser('chrome');
    }).to.throw();
  });

  it('should throw for no arguments in getBrowser', function() {
    expect(function() {
      seleniumAssistant.getLocalBrowser();
    }).to.throw();
  });

  it('should be able to print available browsers', function() {
    this.timeout(NUM_OF_BROWSERS * 3000 * 1000);

    let consoleCalls = 0;
    sandbox.stub(console, 'log').callsFake((input) => {
      consoleCalls++;
    });

    // Console Test
    const output = seleniumAssistant.printAvailableBrowserInfo();

    sandbox.restore();

    (typeof output).should.equal('string');
    consoleCalls.should.equal(1);
  });

  it('should not print table to console', function() {
    this.timeout(NUM_OF_BROWSERS * 3000 * 1000);

    let consoleCalls = 0;
    sandbox.stub(console, 'log').callsFake(() => {
      consoleCalls++;
    });

    // Console Test
    const output = seleniumAssistant.printAvailableBrowserInfo(false);

    sandbox.restore();

    (typeof output).should.equal('string');
    consoleCalls.should.equal(0);
  });

  it('should handle undefined in killWebDriver()', function() {
    const killPromise = seleniumAssistant.killWebDriver();
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should handle null in killWebDriver()', function() {
    const killPromise = seleniumAssistant.killWebDriver(null);
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should throw an error on an object without a quit function', function() {
    const killPromise = seleniumAssistant.killWebDriver({});
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

    const killPromise = seleniumAssistant.killWebDriver({
      close: () => {
        return Promise.resolve();
      },
      quit: () => {
        return Promise.resolve();
      },
    });
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should resolve when a driver with quit method that rejects is injected', function() {
    // Driver quit waits 2 seconds for driver to completely finish
    this.timeout(3000);

    const killPromise = seleniumAssistant.killWebDriver({
      close: () => {
        return Promise.resolve();
      },
      quit: () => {
        return Promise.reject();
      },
    });
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should resolve when a driver with quit method that never resolves is injected', function() {
    // Driver quit waits up to 4 seconds + additional setup time for driver to completely finish
    this.timeout(5000);

    const killPromise = seleniumAssistant.killWebDriver({
      close: () => {
        return Promise.resolve();
      },
      quit: () => {
        return new Promise((resolve, reject) => {});
      },
    });
    (killPromise instanceof Promise).should.equal(true);
    return killPromise;
  });

  it('should return a default value for install dir', function() {
    const directory = seleniumAssistant.getBrowserInstallDir();
    (typeof directory).should.equal('string');
    directory.length.should.be.gt(1);
  });

  it('should return the specified path for install dir', function() {
    const installPath = './test-browsers/';
    seleniumAssistant.setBrowserInstallDir(installPath);
    const directory = seleniumAssistant.getBrowserInstallDir();
    (typeof directory).should.equal('string');
    directory.should.equal(path.resolve(installPath));
  });
});
