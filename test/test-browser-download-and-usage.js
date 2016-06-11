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
  const seleniumWrapper = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['firefox', 'chrome', 'opera'];
  const testPath = './test/test-output';

  before(function() {
    this.timeout(180000);

    return Promise.all([
      seleniumWrapper.downloadFirefoxDriver()
    ]);
  });

  beforeEach(function() {
    return Promise.all([
      del(seleniumWrapper.getBrowserInstallDir(), {force: true}),
      del(testPath)
    ]);
  });

  after(function() {
    return Promise.all([
      del(seleniumWrapper.getBrowserInstallDir(), {force: true}),
      del(testPath)
    ]);
  });

  browserIds.forEach(browserId => {
    it(`should download ${browserId} release if needed and return an updated executable path`, function() {
      this.timeout(180000);

      const globallyAvailableBrowsers = seleniumWrapper.getAvailableBrowsers();
      const originalConfig = {};
      globallyAvailableBrowsers.forEach(browser => {
        if (browser.getSeleniumBrowserId() !== browserId) {
          return;
        }

        originalConfig[browser.getReleaseName()] = browser.getExecutablePath();
      });

      const downloadPromise = [];
      releases.forEach(release => {
        downloadPromise.push(
          seleniumWrapper.downloadBrowser(browserId, release));
      });

      return Promise.all(downloadPromise)
      .then(() => {
        const downloadedBrowsers = seleniumWrapper.getAvailableBrowsers();
        const afterDownloadConfig = {};
        downloadedBrowsers.forEach(browser => {
          if (browser.getSeleniumBrowserId() !== browser) {
            return;
          }

          afterDownloadConfig[browser.getReleaseName()] = browser.getExecutablePath(
            seleniumWrapper.getBrowserInstallDir()
          );
        });

        Object.keys(afterDownloadConfig).forEach(release => {
          if (originalConfig[release]) {
            // If globally installed, it's not forced, so this should be the
            // same as the original.
            afterDownloadConfig[release].should.equal(originalConfig[release]);
          } else {
            // The browser should have been downloaded
            (afterDownloadConfig[release].indexOf(
              seleniumWrapper.getBrowserInstallDir)).should.not.equal(-1);
          }
        });
      })
      .then(() => {
        const downloadedBrowsers = seleniumWrapper.getAvailableBrowsers();
        return downloadedBrowsers.reduce((promiseChain, browser) => {
          if (browser.getSeleniumBrowserId() !== browserId) {
            return promiseChain;
          }

          return promiseChain
          .then(() => {
            const driver = browser.getSeleniumDriver();
            return new Promise((resolve, reject) => {
              driver.get('https://google.com')
              .then(() => {
                return driver.wait(selenium.until.titleIs('Google'), 1000);
              })
              .then(() => {
                return seleniumWrapper.killWebDriver(driver);
              })
              .then(resolve)
              .thenCatch(err => {
                reject(err);
              });
            });
          });
        }, Promise.resolve());
      });
    });

    it(`should force download all ${browserId} releases and return the global executable path`, function() {
      this.timeout(180000);

      const downloadPromise = [];
      releases.forEach(release => {
        downloadPromise.push(
          seleniumWrapper.downloadBrowser(browserId, release, {force: true}));
      });

      return Promise.all(downloadPromise)
      .then(() => {
        const downloadedBrowsers = seleniumWrapper.getAvailableBrowsers();
        const afterDownloadConfig = {};
        downloadedBrowsers.forEach(browser => {
          if (browser.getSeleniumBrowserId() !== browserId) {
            return;
          }

          afterDownloadConfig[browser.getReleaseName()] = browser.getExecutablePath();
        });

        const availableReleases = Object.keys(afterDownloadConfig);
        availableReleases.length.should.equal(3);
        availableReleases.forEach(release => {
          // The browser should have been downloaded
          (afterDownloadConfig[release].indexOf(
            path.normalize(seleniumWrapper.getBrowserInstallDir())
          )).should.not.equal(-1);
        });
      })
      .then(() => {
        const downloadedBrowsers = seleniumWrapper.getAvailableBrowsers();
        return downloadedBrowsers.reduce((promiseChain, browser) => {
          if (browser.getSeleniumBrowserId() !== browserId) {
            return promiseChain;
          }

          return promiseChain
          .then(() => {
            const driver = browser.getSeleniumDriver();
            return new Promise((resolve, reject) => {
              driver.get('https://google.com')
              .then(() => {
                return driver.wait(selenium.until.titleIs('Google'), 1000);
              })
              .then(() => {
                return seleniumWrapper.killWebDriver(driver);
              })
              .then(resolve)
              .thenCatch(err => {
                reject(err);
              });
            });
          });
        }, Promise.resolve());
      });
    });
  });
});
