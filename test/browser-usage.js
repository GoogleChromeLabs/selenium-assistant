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

const fs = require('fs');
const path = require('path');
const selenium = require('selenium-webdriver');
const seleniumAssistant = require('../src/index.js');
const TestServer = require('./helpers/test-server.js');

require('chai').should();

const TIMEOUT = 5 * 60 * 1000;
const RETRIES = 3;
const RELEASES = ['stable', 'beta', 'unstable'];

describe('Test Usage of Browsers', function() {
  this.timeout(TIMEOUT);
  this.retries(RETRIES);

  let globalDriver = null;
  let globalServer = new TestServer(false);
  let localURL = '';

  function testNormalSeleniumUsage(specificBrowser) {
    return specificBrowser.getSeleniumDriver()
    .then((driver) => {
      globalDriver = driver;
    })
    .then(() => {
      return globalDriver.get(localURL)
      .then(() => {
        return globalDriver.wait(selenium.until.titleIs('Example Site'), 1000);
      });
    })
    .then(() => seleniumAssistant.killWebDriver(globalDriver))
    .then(() => {
      globalDriver = null;
    });
  }

  function testBuilderSeleniumUsage(specificBrowser) {
    const builder = specificBrowser.getSeleniumDriverBuilder();

    return builder.build()
    .then((driver) => {
      globalDriver = driver;
    })
    .then(() => {
      return globalDriver.get(localURL);
    })
    .then(() => {
      return globalDriver.wait(selenium.until.titleIs('Example Site'), 1000);
    })
    .then(() => {
      return seleniumAssistant.killWebDriver(globalDriver);
    })
    .then(() => {
      globalDriver = null;
    });
  }

  function testBrowserInfo(specificBrowser) {
    const versionString = specificBrowser.getRawVersionString();
    (versionString === null).should.equal(false);
    versionString.length.should.gt(0);

    const versionNumber = specificBrowser.getVersionNumber();
    versionNumber.should.not.equal(-1);
  }

  function setupTest(localBrowser) {
    it(`should be able to use ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`, function() {
      if (localBrowser.isBlackListed()) {
        console.warn(`Browser is blacklisted ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`);
        return;
      }

      if (!localBrowser.isValid()) {
        console.warn(`Browser is invalid ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`);
        return;
      }

      return testNormalSeleniumUsage(localBrowser)
      .then(() => testBuilderSeleniumUsage(localBrowser))
      .then(() => testBrowserInfo(localBrowser));
    });
  }

  before(function() {
    seleniumAssistant.setBrowserInstallDir(null);

    console.log('Downloading browsers....');
    return Promise.all([
      seleniumAssistant.downloadLocalBrowser('chrome', 'stable'),
      seleniumAssistant.downloadLocalBrowser('chrome', 'beta'),
      seleniumAssistant.downloadLocalBrowser('chrome', 'unstable'),
      seleniumAssistant.downloadLocalBrowser('firefox', 'stable'),
      seleniumAssistant.downloadLocalBrowser('firefox', 'beta'),
      seleniumAssistant.downloadLocalBrowser('firefox', 'unstable'),
    ])
    .catch((err) => {
      console.warn('There was an issue downloading the browsers: ', err);
    })
    .then(() => {
      console.log('Download of browsers complete.');

      const serverPath = path.join(__dirname, 'data', 'example-site');
      return globalServer.startServer(serverPath);
    })
    .then((portNumber) => {
      localURL = `http://localhost:${portNumber}/`;
    });
  });

  afterEach(function() {
    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    .then(() => {
      globalDriver = null;
    });
  });

  after(function() {
    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    .then(() => {
      return globalServer.killServer();
    });
  });

  const localBrowserFiles = fs.readdirSync('./src/local-browsers');
  localBrowserFiles.forEach((localBrowserFile) => {
    const LocalBrowserClass = require(`./../src/local-browsers/${localBrowserFile}`);
    RELEASES.forEach((release) => {
      const localBrowser = new LocalBrowserClass(release);
      setupTest(localBrowser);
    });
  });
});
