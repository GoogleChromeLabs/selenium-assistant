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
const sinon = require('sinon');
const selenium = require('selenium-webdriver');
const seleniumAssistant = require('../src/index.js');
const TestServer = require('./helpers/test-server.js');
const expect = require('chai').expect;

require('chai').should();

const TIMEOUT = 5 * 60 * 1000;
const RETRIES = 3;

describe('Test Usage of Browsers', function() {
  this.timeout(TIMEOUT);
  this.retries(RETRIES);

  const sandbox = sinon.createSandbox();
  let globalDriver = null;
  const globalServer = new TestServer(false);
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
    (typeof versionString).should.equal('string');
    (versionString === null).should.equal(false);
    versionString.length.should.gt(0);

    const versionNumber = specificBrowser.getVersionNumber();
    (typeof versionNumber).should.equal('number');
    if (versionString) {
      versionNumber.should.not.equal(-1);
    }

    const prettyName = specificBrowser.getPrettyName();
    prettyName.length.should.gt(1);

    const options = specificBrowser.getSeleniumOptions();
    expect(options).to.exist;

    const executablePath = specificBrowser.getExecutablePath();
    (typeof executablePath).should.equal('string');
  }

  function setupTest(localBrowser) {
    describe(`Test Usage of ${localBrowser.getPrettyName()}`, function() {
      it(`should be able to use ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`, function() {
        if (localBrowser.isDenyListed()) {
          console.warn(`Browser is denylisted ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`);
          return;
        }

        if (!localBrowser.isValid()) {
          console.warn(`Browser is invalid ${localBrowser.getId()} - ${localBrowser.getReleaseName()}`);
          return;
        }

        testBrowserInfo(localBrowser);
        return testNormalSeleniumUsage(localBrowser)
            .then(() => testBuilderSeleniumUsage(localBrowser));
      });

      it('should get null for raw version output if no executable found', function() {
        sandbox.stub(localBrowser, 'getExecutablePath').callsFake(() => {
          return null;
        });

        // To overcome version string caching
        localBrowser._rawVerstionString = null;

        const rawString = localBrowser.getRawVersionString();
        (rawString === null).should.equal(true);
      });

      it('should get -1 for version number if no executable found', function() {
        sandbox.stub(localBrowser, 'getExecutablePath').callsFake(() => {
          return null;
        });

        // To overcome version string caching
        localBrowser._rawVerstionString = null;

        const versionNumber = localBrowser.getVersionNumber();
        versionNumber.should.equal(-1);
      });

      it('should get -1 for an unexpected raw version string', function() {
        sandbox.stub(localBrowser, 'getRawVersionString').callsFake(() => {
          return 'ImTotallyMadeUp 12345678.asdf.12345678.asdf';
        });

        // To overcome version string caching
        localBrowser._rawVerstionString = null;

        const versionNumber = localBrowser.getVersionNumber();
        versionNumber.should.equal(-1);
      });
    });
  }

  before(function() {
    seleniumAssistant.setBrowserInstallDir(null);

    const expiration = process.env.TRAVIS ? 0 : 24;
    console.log('Downloading browsers....');
    return Promise.all([
      seleniumAssistant.downloadLocalBrowser('chrome', 'stable', expiration),
      seleniumAssistant.downloadLocalBrowser('chrome', 'beta', expiration),
      seleniumAssistant.downloadLocalBrowser('firefox', 'stable', expiration),
      seleniumAssistant.downloadLocalBrowser('firefox', 'beta', expiration),
      seleniumAssistant.downloadLocalBrowser('firefox', 'unstable', expiration),
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
    sandbox.restore();

    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
        .then(() => {
          globalDriver = null;
        });
  });

  after(function() {
    return globalServer.killServer();
  });

  const localBrowserFiles = fs.readdirSync(
      path.join(__dirname, '..', 'src', 'local-browsers'));
  localBrowserFiles.forEach((localBrowserFile) => {
    const LocalBrowserClass = require(`./../src/local-browsers/${localBrowserFile}`);
    const browserReleases = LocalBrowserClass.getPrettyReleaseNames();
    Object.keys(browserReleases).forEach((release) => {
      const localBrowser = new LocalBrowserClass(release);
      setupTest(localBrowser);
    });
  });
});
