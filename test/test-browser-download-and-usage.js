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
const selenium = require('selenium-webdriver');

require('chai').should();

describe('Test Download and Usage of Browsers', function() {
  const seleniumAssistant = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['firefox', 'chrome', 'opera'];
  const testPath = './test/test-output';

  let globalDriver = null;

  before(function() {
    this.timeout(180000);

    seleniumAssistant.setBrowserInstallDir(testPath);
    // return Promise.all([
    //   seleniumAssistant.downloadFirefoxDriver()
    // ]);
  });

  beforeEach(function() {
    // Timeout is to account for slow closing of selenium web driver browser
    this.timeout(4000);

    return Promise.all([
      // del(seleniumAssistant.getBrowserInstallDir(), {force: true}),
      // del(testPath),
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
      del(testPath),
      seleniumAssistant.killWebDriver(globalDriver)
    ]);
  });

  browserIds.forEach(browserId => {
    releases.forEach(release => {
      it(`should download ${browserId} - ${release} if needed and return an updated executable path`, function() {
        this.timeout(60000);

        const globallyAvailableBrowsers = seleniumAssistant.getAvailableBrowsers();
        let originalPath = null;
        globallyAvailableBrowsers.forEach(browser => {
          if (browser.getSeleniumBrowserId() !== browserId ||
            browser.getReleaseName() !== release) {
            return;
          }

          originalPath = browser.getExecutablePath();
        });

        return seleniumAssistant.downloadBrowser(browserId, release)
        .then(() => {
          const downloadedBrowsers = seleniumAssistant.getAvailableBrowsers();
          let afterDownloadPath = null;
          let selectedBrowser;
          downloadedBrowsers.forEach(browser => {
            if (browser.getSeleniumBrowserId() !== browserId ||
              browser.getReleaseName() !== release) {
              return;
            }

            selectedBrowser = browser;
            afterDownloadPath = browser.getExecutablePath();
          });

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

          return selectedBrowser;
        })
        .then(selectedBrowser => {
          console.log('');
          console.log('');
          console.log('');
          seleniumAssistant.printAvailableBrowserInfo();

          globalDriver = selectedBrowser.getSeleniumDriver();
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

      it(`should force download ${browserId} - ${release} and return the global executable path`, function() {
        this.timeout(60000);

        return seleniumAssistant.downloadBrowser(browserId, release, {force: true})
        .then(() => {
          const downloadedBrowsers = seleniumAssistant.getAvailableBrowsers();
          let afterDownloadPath = null;
          let selectedBrowser = null;
          downloadedBrowsers.forEach(browser => {
            if (browser.getSeleniumBrowserId() !== browserId ||
              browser.getReleaseName() !== release) {
              return;
            }

            selectedBrowser = browser;
            afterDownloadPath = browser.getExecutablePath();
          });

          afterDownloadPath.indexOf(
            path.normalize(seleniumAssistant.getBrowserInstallDir())
          ).should.not.equal(-1);

          return selectedBrowser;
        })
        .then(selectedBrowser => {
          console.log('');
          console.log('');
          console.log('');
          seleniumAssistant.printAvailableBrowserInfo();

          globalDriver = selectedBrowser.getSeleniumDriver();
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
