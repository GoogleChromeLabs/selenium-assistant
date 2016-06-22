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
const spawn = require('child_process').spawn;
const fs = require('fs');
const selenium = require('selenium-webdriver');

require('chai').should();

describe('Test Download and Usage of Browsers', function() {
  const seleniumAssistant = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['chrome'];

  if (process.platform !== 'darwin' || (process.env.RELEASE !== 'true' &&
    process.env.TRAVIS !== 'true')) {
    browserIds.push('firefox');
    browserIds.push('opera');
  }

  if (process.platform === 'darwin') {
    // TODO: Need to figure out how to test Safar with download etc.
    // browserIds.push('safari');
  }

  const testPath = './test/test-output';

  let globalDriver = null;

  before(function() {
    this.timeout(180000);

    seleniumAssistant.setBrowserInstallDir(testPath);

    return Promise.all([
      seleniumAssistant.downloadFirefoxDriver()
      .catch(err => {
        // This is likely to have errored due to github rate limit.
        console.warn(chalk.red('WARNING') + ': Unable to get Firefox Driver ' +
          err);

        let fallbackGeckoDriverPath;
        switch (process.platform) {
          case 'linux':
            fallbackGeckoDriverPath = './test/data/geckodriver/geckodriver' +
              '-0.8.0-linux64.gz';
            break;
          case 'darwin':
            fallbackGeckoDriverPath = './test/data/geckodriver/geckodriver' +
              '-0.8.0-OSX.gz';
            break;
          default:
            throw new Error('Unsupported platform for Firefox ' +
              'driver fallback.');
        }

        return new Promise(function(resolve, reject) {
          const untarProcess = spawn('gzip', [
            '--keep',
            '-d',
            fallbackGeckoDriverPath,
            '-f'
          ]);

          untarProcess.on('exit', code => {
            if (code === 0) {
              try {
                const extractedFileName = path.parse(fallbackGeckoDriverPath).name;
                fs.renameSync(
                  path.join('./test/data/geckodriver/', extractedFileName),
                  path.join('.', 'wires')
                );
                fs.chmodSync(path.join('.', 'wires'), '755');
                return resolve();
              } catch (err) {
                return reject(err);
              }
            }

            reject(new Error('Unable to extract gzip'));
          });
        });
      })
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
      // del(seleniumAssistant.getBrowserInstallDir(), {force: true}),
      seleniumAssistant.killWebDriver(globalDriver)
    ]);
  });

  browserIds.forEach(browserId => {
    releases.forEach(release => {
      const globallyAvailableBrowsers = seleniumAssistant.getAvailableBrowsers();
      let specificBrowser;
      globallyAvailableBrowsers.forEach(browser => {
        if (browser.getSeleniumBrowserId() !== browserId ||
          browser.getReleaseName() !== release) {
          return;
        }

        specificBrowser = browser;
      });

      if (!specificBrowser) {
        return;
      }

      it(`should download ${browserId} - ${release} if needed and return an updated executable path`, function() {
        this.timeout(180000);
        let originalPath = specificBrowser.getExecutablePath();
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
        this.timeout(180000);

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
    });
  });
});
