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

const del = require('del');
const path = require('path');
const chalk = require('chalk');
const selenium = require('selenium-webdriver');

require('chai').should();

describe('Test Download and Usage of Browsers', function() {
  this.retries(3);

  const DOWNLOAD_TIMEOUT = 5 * 60 * 1000;
  const seleniumAssistant = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['chrome', 'firefox'];

  if (
    // Opera on OS X requires user prompt
    process.platform !== 'darwin' ||
    // This isn't a release and it's not a travis run
    (process.env.RELEASE !== 'true' && process.env.TRAVIS !== 'true')
  ) {
    browserIds.push('opera');
  }

  if (process.platform === 'darwin') {
    // Need to figure out how to test Safar with download etc.
    // browserIds.push('safari');
  }

  const testPath = './test/test-output';

  let globalDriver = null;

  before(function() {
    this.timeout(180000);

    seleniumAssistant.setBrowserInstallDir(testPath);

    return Promise.all([
      seleniumAssistant.downloadFirefoxDriver()
    ]);
  });

  beforeEach(function() {
    // Timeout is to account for slow closing of selenium web driver browser
    this.timeout(4000);

    return Promise.all([
      del(seleniumAssistant.getBrowserInstallDir(), {force: true}),
      seleniumAssistant.killWebDriver(globalDriver)
    ])
    .then(() => {
      globalDriver = null;
    });
  });

  after(function() {
    this.timeout(4000);

    return Promise.all([
      del(seleniumAssistant.getBrowserInstallDir(), {force: true}),
      seleniumAssistant.killWebDriver(globalDriver)
    ]);
  });

  browserIds.forEach(browserId => {
    releases.forEach(release => {
      let specificBrowser = seleniumAssistant.getBrowser(browserId, release);
      if (!specificBrowser) {
        console.warn(chalk.red('WARNING:') + ' Unable to find ' +
          browserId + ' ' + release);
        return;
      }

      it(`should download ${browserId} - ${release} if needed and return an updated executable path`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        let originalPath = null;
        if (specificBrowser.isValid()) {
          originalPath = specificBrowser.getExecutablePath();
        }
        return seleniumAssistant.downloadBrowser(browserId, release)
        .then(() => {
          let afterDownloadPath = specificBrowser.getExecutablePath();
          if (originalPath) {
            // If globally installed, it's not forced, so this should be the
            // same as the original.
            afterDownloadPath.should.equal(originalPath);
          } else {
            // The browser should have been downloaded
            afterDownloadPath.indexOf(
              path.normalize(seleniumAssistant.getBrowserInstallDir())
            ).should.not.equal(-1);
          }
        })
        .then(() => {
          console.log('');
          console.log('');
          console.log('After Possible Download');
          seleniumAssistant.printAvailableBrowserInfo();

          return specificBrowser.getSeleniumDriver()
          .then(driver => {
            globalDriver = driver;
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              globalDriver.get('https://google.com')
              .then(() => {
                return globalDriver.wait(selenium.until.titleIs('Google'), 1000);
              })
              .then(resolve)
              .thenCatch(err => {
                reject(err);
              });
            });
          });
        });
      });

      it(`should force download ${browserId} - ${release} and return the global executable path`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        return seleniumAssistant.downloadBrowser(browserId, release, {force: true})
        .then(() => {
          let afterDownloadPath = specificBrowser.getExecutablePath();

          if (browserId === 'opera' && process.platform === 'darwin') {
            afterDownloadPath.indexOf(
              path.normalize('/Applications/Opera')
            ).should.not.equal(-1);
          } else {
            afterDownloadPath.indexOf(
              path.normalize(seleniumAssistant.getBrowserInstallDir())
            ).should.not.equal(-1);
          }
        })
        .then(() => {
          console.log('');
          console.log('');
          console.log('After Forced Download');
          seleniumAssistant.printAvailableBrowserInfo();

          return specificBrowser.getSeleniumDriver()
          .then(driver => {
            globalDriver = driver;
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              globalDriver.get('https://google.com')
              .then(() => {
                return globalDriver.wait(selenium.until.titleIs('Google'), 1000);
              })
              .then(resolve)
              .thenCatch(err => {
                reject(err);
              });
            });
          });
        });
      });

      it(`should force download ${browserId} - ${release} and be able to use the web driver builder manually`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        return seleniumAssistant.downloadBrowser(browserId, release, {force: true})
        .then(() => {
          let afterDownloadPath = specificBrowser.getExecutablePath();

          if (browserId === 'opera' && process.platform === 'darwin') {
            afterDownloadPath.indexOf(
              path.normalize('/Applications/Opera')
            ).should.not.equal(-1);
          } else {
            afterDownloadPath.indexOf(
              path.normalize(seleniumAssistant.getBrowserInstallDir())
            ).should.not.equal(-1);
          }
        })
        .then(() => {
          console.log('');
          console.log('');
          console.log('After Forced Download');
          seleniumAssistant.printAvailableBrowserInfo();

          const builder = specificBrowser.getSeleniumDriverBuilder();

          return builder.buildAsync()
          .then(driver => {
            globalDriver = driver;
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              globalDriver.get('https://google.com')
              .then(() => {
                return globalDriver.wait(selenium.until.titleIs('Google'), 1000);
              })
              .then(resolve)
              .thenCatch(err => {
                reject(err);
              });
            });
          });
        });
      });
    });
  });
});
