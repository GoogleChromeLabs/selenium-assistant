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

const ChromeWebDriverBrowser = require('./webdriver-browser/chrome');
const FirefoxWebDriverBrowser = require('./webdriver-browser/firefox');
const OperaWebDriverBrowser = require('./webdriver-browser/opera');

/**
 * AutomatedBrowserTesting is a class that makes
 * it easier to launch a browser and run mocha tests.
 *
 * @example <caption>Usage in Node</caption>
 * const automatedBrowserTesting = require('sw-testing-helpers').automatedBrowserTesting;
 * const browsers = automatedBrowserTesting.getDiscoverableBrowsers();
 * browsers.forEach(browser => {
 *   console.log(browsers.getPrettyName());
 *   console.log(browsers.getReleaseName());
 * });
 */
class AutomatedBrowserTesting {
  /**
   * <p>This method returns a list of discovered browsers in the current
   * environment.</p>
   *
   * <p><strong>NOTE:</strong> For Firefox please define `FF_BETA_PATH`
   * and / or `FF_NIGHTLY_PATH` as environment variables if you want to use
   * Beta and Nightly versions of Firefox.</p>
   *
   * <p>This method will throw an error if run on a platform other than
   * OS X and Linux.</p>
   *
   * @return {Array<WebDriverBrowser>} Array of browsers discovered in the
   * current environment.
   */
  getDiscoverableBrowsers() {
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      throw new Error('Sorry this library only supports OS X and Linux.');
    }

    let webdriveBrowsers = [
      new ChromeWebDriverBrowser('stable'),
      new ChromeWebDriverBrowser('beta'),
      new ChromeWebDriverBrowser('unstable'),
      new FirefoxWebDriverBrowser('stable'),
      new FirefoxWebDriverBrowser('beta'),
      new FirefoxWebDriverBrowser('unstable'),
      new OperaWebDriverBrowser('stable'),
      new OperaWebDriverBrowser('beta'),
      new OperaWebDriverBrowser('unstable')
    ];

    webdriveBrowsers = webdriveBrowsers.filter(webdriverBrowser => {
      if (!webdriverBrowser.isValidWebDriver()) {
        return false;
      }

      return true;
    });

    return webdriveBrowsers;
  }

  /**
   * Once a web driver is no longer needed call this method to kill it. The
   * promise resolves once the browser is closed and clean up has been done.
   * @param  {WebDriver} driver Instance of a {@link http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebDriver.html | WebDriver}
   * @return {Promise}          Promise that resolves once the browser is killed.
   */
  killWebDriver(driver) {
    return new Promise(resolve => {
      if (driver === null) {
        return resolve();
      }

      // Suggested as fix to 'chrome not reachable'
      // http://stackoverflow.com/questions/23014220/webdriver-randomly-produces-chrome-not-reachable-on-linux-tests
      const timeoutGapCb = function() {
        setTimeout(resolve, 2000);
      };

      driver.quit()
      .then(() => {
        timeoutGapCb();
      })
      .thenCatch(() => {
        timeoutGapCb();
      });
    });
  }
}

module.exports = AutomatedBrowserTesting;
