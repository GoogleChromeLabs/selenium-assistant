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

const path = require('path');
const chalk = require('chalk');
const selenium = require('selenium-webdriver');

const TestServer = require('./helpers/test-server.js');

require('geckodriver');
require('chromedriver');

require('chai').should();

describe('Test Usage of Browsers', function() {
  if ((process.env.TRAVIS || process.env.RELASE)) {
    this.retries(3);
  }

  const DOWNLOAD_TIMEOUT = 5 * 60 * 1000;
  const seleniumAssistant = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['chrome', 'firefox'];

  if (!(process.env.TRAVIS || process.env.RELASE)) {
    browserIds.push('opera');
  }

  // Travis has Safari, but the extension won't be installed :(
  if ((!process.env.TRAVIS || process.env.RELASE) && process.platform === 'darwin') {
    browserIds.push('safari');
  }

  let globalDriver = null;
  let globalServer = new TestServer(false);
  let localURL = '';

  before(function() {
    this.timeout(5 * 60 * 1000);

    seleniumAssistant.setBrowserInstallDir(null);

    console.log('Downloading browsers....');
    return Promise.all([
      seleniumAssistant.downloadBrowser('chrome', 'stable'),
      seleniumAssistant.downloadBrowser('chrome', 'beta'),
      seleniumAssistant.downloadBrowser('chrome', 'unstable'),
      seleniumAssistant.downloadBrowser('firefox', 'stable'),
      seleniumAssistant.downloadBrowser('firefox', 'beta'),
      seleniumAssistant.downloadBrowser('firefox', 'unstable'),
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

  beforeEach(function() {
    // Timeout is to account for slow closing of selenium web driver browser
    this.timeout(180000);

    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    .then(() => {
      globalDriver = null;
    });
  });

  after(function() {
    this.timeout(6000);

    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    .then(() => {
      return globalServer.killServer();
    });
  });

  function isBlackListed(specificBrowser) {
    // Return true to blacklist
    if (specificBrowser.getSeleniumBrowserId() === 'opera' &&
      specificBrowser.getVersionNumber() === 41) {
      // Opera 41 is broken with Opera driver v0.2.2
      return true;
    }
    return false;
  }

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

    const versionNumber = specificBrowser.getVersionNumber();
    versionNumber.should.not.equal(-1);
  }

  browserIds.forEach((browserId) => {
    releases.forEach((release) => {
      if (browserId === 'safari' && release === 'unstable') {
        // Safari unstable doesn't exist so skip it.
        return;
      }

      if (browserId === 'safari') {
        // Safari fails (both stable and beta) with
        // "Error: Server terminated early with status 1".
        return;
      }

      const specificBrowser = seleniumAssistant.getBrowser(browserId, release);
      if (!specificBrowser) {
        console.warn(`${chalk.red('WARNING:')} Unable to find ${browserId} ` +
          ` ${release}`);
        return;
      }

      it(`should be able to use ${browserId} - ${release}`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        if (!specificBrowser.isValid()) {
          if (browserId === 'opera') {
            console.warn('Opera not available in this environment.');
            return;
          }

          throw new Error(`Browser is unexpectidly invalid ${browserId} - ${release}`);
        }

        let afterDownloadPath = specificBrowser.getExecutablePath();
        if (browserId === 'opera') {
          if (process.platform === 'darwin') {
            afterDownloadPath.indexOf(
              path.normalize('/Applications/Opera')
            ).should.not.equal(-1);
          } else {
            console.warn('        Unable to ensure location of Opera on this ' +
              'platform.');
          }
        } else {
          afterDownloadPath.indexOf(
            path.normalize(seleniumAssistant.getBrowserInstallDir())
          ).should.not.equal(-1);
        }

        if (isBlackListed(specificBrowser)) {
          console.log(`Skipping ${browserId} - ${release} due to blacklist.`);
          return;
        }

        return testNormalSeleniumUsage(specificBrowser)
        .then(() => testBuilderSeleniumUsage(specificBrowser))
        .then(() => testBrowserInfo(specificBrowser));
      });
    });
  });
});
