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

const TestServer = require('./helpers/test-server.js');

require('geckodriver');
require('chai').should();

describe('Test Download and Usage of Browsers', function() {
  this.retries(3);

  const DOWNLOAD_TIMEOUT = 5 * 60 * 1000;
  const seleniumAssistant = require('../src/index.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browserIds = ['chrome', 'firefox'];

  // Can't test on Opera. Sadly OS X requires manual intervention to install
  // Linux download URL's are unique for each release.
  // if (
  //   // Opera on OS X requires user prompt
  //   process.platform !== 'darwin' ||
  //   // This isn't a release and it's not a travis run
  //   (process.env.RELEASE !== 'true' && process.env.TRAVIS !== 'true')
  // ) {
  //   browserIds.push('opera');
  // }

  // Travis has Safari, but the extension won't be installed :(
  if ((!process.env.TRAVIS) && process.platform === 'darwin') {
    browserIds.push('safari');
  }

  const testPath = './test/test-output';

  let globalDriver = null;
  let globalServer = new TestServer(false);
  let localURL = '';

  before(function() {
    this.timeout(180000);

    seleniumAssistant.setBrowserInstallDir(testPath);

    // Ensure the test output is clear at the start
    return del(seleniumAssistant.getBrowserInstallDir(), {force: true})
    .then(() => {
      // return seleniumAssistant.downloadFirefoxDriver();
    })
    .then(() => {
      const serverPath = path.join(__dirname, 'data', 'example-site');
      return globalServer.startServer(serverPath);
    })
    .then(portNumber => {
      localURL = `http://localhost:${portNumber}/`;
    });
  });

  beforeEach(function() {
    // Timeout is to account for slow closing of selenium web driver browser
    this.timeout(180000);

    return Promise.all([
      seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    ])
    .then(() => {
      globalDriver = null;
    });
  });

  after(function() {
    this.timeout(6000);

    return Promise.all([
      del(seleniumAssistant.getBrowserInstallDir(), {force: true}),
      seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    ])
    .then(() => {
      return globalServer.killServer();
    });
  });

  function isBlackListed(specificBrowser) {
    return false;
  }

  function testBrowserInfo(specificBrowser) {
    const versionString = specificBrowser.getRawVersionString();
    (versionString === null).should.equal(false);

    const versionNumber = specificBrowser.getVersionNumber();
    versionNumber.should.not.equal(-1);
  }

  browserIds.forEach(browserId => {
    releases.forEach(release => {
      if (browserId === 'safari' && release === 'unstable') {
        // Safari unstable doesn't exist so skip it.
        return;
      }

      if (browserId === 'safari') {
        // Safari fails (both stable and beta) with
        // "Error: Server terminated early with status 1".
        return;
      }

      let specificBrowser = seleniumAssistant.getBrowser(browserId, release);
      if (!specificBrowser) {
        console.warn(chalk.red('WARNING:') + ' Unable to find ' +
          browserId + ' ' + release);
        return;
      }

      it(`should download ${browserId} - ${release} if needed and return an updated executable path`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        if ((!specificBrowser.isValid()) && specificBrowser.getSeleniumBrowserId() === 'safari') {
          console.warn('Safari isn\'t available on this machine and we can\'t download it so skipping the tests.');
        }

        let originalPath = null;
        if (specificBrowser.isValid()) {
          originalPath = specificBrowser.getExecutablePath();
        }

        if (!originalPath) {
          console.warn(`${specificBrowser.getPrettyName()} doesn't exist on the current machine so skipping to force download.`);
          return;
        }

        return seleniumAssistant.downloadBrowser(browserId, release)
        .then(() => {
          let afterDownloadPath = specificBrowser.getExecutablePath();
          afterDownloadPath.should.equal(originalPath);
        })
        .then(() => {
          if (isBlackListed(specificBrowser)) {
            console.log('Skipping due to blacklist.');
            return;
          }

          return specificBrowser.getSeleniumDriver()
          .then(driver => {
            globalDriver = driver;
          })
          .then(() => {
            return globalDriver.get(localURL)
            .then(() => {
              return globalDriver.wait(selenium.until.titleIs('Example Site'), 1000);
            });
          })
          .then(() => {
            // Safari 10+ is not happy with the methods used to determine
            // browser info.
            if (browserId !== 'safari') {
              return testBrowserInfo(specificBrowser);
            }
          });
        });
      });

      it(`should force download ${browserId} - ${release} and return the global executable path`, function() {
        this.timeout(DOWNLOAD_TIMEOUT);

        if (browserId === 'safari') {
          // Safari can't be downloaded.
          console.log('Safari can\'t be downloaded at the moment so skipping test.');
          return;
        }

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
          if (isBlackListed(specificBrowser)) {
            console.log('Skipping due to blacklist.');
            return;
          }

          return specificBrowser.getSeleniumDriver()
          .then(driver => {
            globalDriver = driver;
          })
          .then(() => {
            return globalDriver.get(localURL)
            .then(() => {
              return globalDriver.wait(selenium.until.titleIs('Example Site'), 1000);
            })
            .then(() => {
              return seleniumAssistant.killWebDriver(globalDriver);
            });
          })
          .then(() => {
            // Test using builder manually
            const builder = specificBrowser.getSeleniumDriverBuilder();

            return builder.buildAsync()
            .then(driver => {
              globalDriver = driver;
            })
            .then(() => {
              return globalDriver.get(localURL)
              .then(() => {
                return globalDriver.wait(selenium.until.titleIs('Example Site'), 1000);
              });
            });
          })
          .then(() => {
            // Safari 10+ is not happy with the methods used to determine
            // browser info.
            if (browserId !== 'safari') {
              return testBrowserInfo(specificBrowser);
            }
          });
        });
      });
    });
  });
});
