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

const chalk = require('chalk');

const application = require('./application-state.js');
const browserManager = require('./browser-manager.js');
const downloadManager = require('./download-manager.js');

/**
 * When you require in the `selenium-assistant` module an instance of this
 * SeleniumAssistant class will be returned.
 *
 * This method gives you the require APIs to manage downloading of browsers,
 * accessing required browsers and making use of SaucesLabs.
 *
 * @example <caption>Usage in Node</caption>
 * const seleniumAssistant = require('selenium-assistant');
 *
 * const browsers = seleniumAssistant.getLocalBrowsers();
 * browsers.map(browser => {
 *   console.log(browser.getPrettyName());
 *   console.log(browser.getReleaseName());
 *
 *   return browser.getSeleniumDriver()
 *   .then((driver) => {
 *     return driver.get('https://google.com/')
 *     .then(() => {
 *      return seleniumAssistant.killWebDriver(driver);
 *     });
 *   });
 * });
 */
class SeleniumAssistant {
  /**
   * Returns the browser download path.
   * @return {String} Path of downloaded browsers
   */
  getBrowserInstallDir() {
    return application.getInstallDirectory();
  }

  /**
   * To change where browsers are downloaded to, call this method
   * before calling
   * [downloadLocalBrowser()]{@link SeleniumAssistant#downloadLocalBrowser} and
   * [getLocalBrowsers()]{@link SeleniumAssistant#getLocalBrowsers}.
   *
   * By default, this will install under `.selenium-assistant` in
   * your home directory on OS X and Linux, or just `selenium-assistant`
   * in your home directory on Windows.
   *
   * @param {String} newInstallDir Path to download browsers to. Pass in
   * null to use default path.
   */
  setBrowserInstallDir(newInstallDir) {
    application.setInstallDirectory(newInstallDir);
  }

  /**
   * This downloads a browser with browser ID of 'chrome' or 'firefox' and
   * a release type of 'stable', 'beta', 'unstable'. SeleniumAssistant
   * will download the browser and keep a track of when it was last downloaded.
   *
   * The next time a download is requested, seleniumAssistant will check if the
   * browser is within the `expirationInHours` parameter and if it is, resolve
   * the promise.
   *
   * Any programs using selenium-assistant will share the same browser
   * downloads reducing overall download time (unless
   * [setBrowserInstallDir()]{@link SeleniumAssistant#setBrowserInstallDir}
   * is called with a unique directory).
   *
   * @param  {String} browserId The selenium ID of the browser you wish
   * to download.
   * @param  {String} release The release channel of the browser. Can be
   * 'stable', 'beta' or 'unstable'
   * @param  {Number} [expirationInHours=24] This is how long until a browser
   * download is regarded as expired and should be updated.
   * A value of 0 will force a download.
   * @return {Promise} The promise resolves once the browser has been
   * downloaded.
   *
   * @example
   * return Promise.all([
  *   seleniumAssistant.downloadLocalBrowser('chrome', 'stable', 48),
  *   seleniumAssistant.downloadLocalBrowser('chrome', 'beta', 48),
  *   seleniumAssistant.downloadLocalBrowser('firefox', 'stable', 48),
  *   seleniumAssistant.downloadLocalBrowser('firefox', 'beta', 48),
  *   seleniumAssistant.downloadLocalBrowser('firefox', 'unstable', 48),
   * ])
   * .then(() => {
   *   console.log('Browser download complete.');
   * })
   * .catch((err) => {
   *   console.error('Browser download failed.');
   * });
   *
   */
  downloadLocalBrowser(browserId, release, expirationInHours) {
    return downloadManager.downloadLocalBrowser(
        browserId, release, expirationInHours);
  }

  /**
   * Most users of this library will want to make use of
   * {@link getLocalBrowsers} to get all available  browsers in the current
   * environment.
   *
   * If you need a specific browser use this method to retrieve it. Use
   * [LocalBrowser.isValid()]{@link LocalBrowser#isValid} to check if the
   * browser is available on the current environment.
   *
   * @param  {String} browserId The selenium id of the browser you want.
   * @param  {String} release The release of the browser you want. Either
   * 'stable', 'beta' or 'unstable.'
   * @return {LocalBrowser} A LocalBrowser instance that represents
   * your request.
   */
  getLocalBrowser(browserId, release) {
    return browserManager.getLocalBrowser(browserId, release);
  }

  /**
   * This method returns a list of available browsers in the current
   * environment.
   *
   * This method will throw an error if run on a platform other than
   * OS X and Linux.
   *
   * @return {Array<LocalBrowser>} Array of browsers discovered in the
   * current environment.
   */
  getLocalBrowsers() {
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      throw new Error('Sorry this library only supports OS X and Linux.');
    }

    let webdriverBrowsers = browserManager.getSupportedBrowsers();
    webdriverBrowsers = webdriverBrowsers.filter((webdriverBrowser) => {
      return webdriverBrowser.isValid();
    });

    return webdriverBrowsers;
  }

  /**
   * This method prints out a table of info for all available browsers
   * on the current environment.
   *
   * Useful if you are testing on Travis and want to see what tests
   * should be running, but be cautious to print this only at the start
   * of your tests to avoid excessive logging.
   *
   * @param {Boolean} [printToConsole=true] - If you wish to prevent
   * the table being printed to the console, you can suppress it by
   * passing in false and simply get the string response.
   * @return {String} Returns table of information as a string.
   */
  printAvailableBrowserInfo(printToConsole) {
    if (typeof printToConsole === 'undefined') {
      printToConsole = true;
    }

    const rows = [];
    rows.push([
      'Browser Name',
      'Browser Version',
      'Path',
    ]);

    const browsers = this.getLocalBrowsers();
    browsers.forEach((browser) => {
      rows.push([
        browser.getPrettyName(),
        browser.getVersionNumber().toString(),
        browser.getExecutablePath(),
      ]);
    });

    const noOfColumns = rows[0].length;
    const rowLengths = [];
    for (let i = 0; i < noOfColumns; i++) {
      let currentRowMaxLength = 0;
      rows.forEach((row) => {
        currentRowMaxLength = Math.max(
            currentRowMaxLength, row[i].length);
      });
      rowLengths[i] = currentRowMaxLength;
    }

    let totalRowLength = rowLengths.reduce((a, b) => a + b, 0);

    // Account for spaces and markers
    totalRowLength += (noOfColumns * 3) + 1;

    let outputString = chalk.gray('-'.repeat(totalRowLength)) + '\n';
    rows.forEach((row, rowIndex) => {
      const color = rowIndex === 0 ? chalk.bold : chalk.blue;
      const coloredRows = row.map((column, columnIndex) => {
        const padding = rowLengths[columnIndex] - column.length;
        if (padding > 0) {
          return color(column) + ' '.repeat(padding);
        }
        return color(column);
      });

      const rowString = coloredRows.join(' | ');

      outputString += '| ' + rowString + ' |\n';
    });

    outputString += chalk.gray('-'.repeat(totalRowLength)) + '\n';

    if (printToConsole) {
      /* eslint-disable no-console */
      console.log(outputString);
      /* eslint-enable no-console */
    }

    return outputString;
  }

  /**
   * If you wish to use Sauce Labs to host the browser instances you can
   * do so by setting your saucelab details with this method before calling
   * [getSauceLabsBrowser()]{@link SeleniumAssistant#getSauceLabsBrowser}.
   * @param {String} username The Sauce Labs username.
   * @param {String} accessKey The Sauce Labs access key.
   */
  setSaucelabsDetails(username, accessKey) {
    application.setSaucelabsDetails(username, accessKey);
  }

  /**
   * Get a Sauce Labs hosted browser for a particular browser ID and a
   * particular browser version.
   * @param {String} browserId The selenium browser ID.
   * @param {String} browserVersion The Sauce Labs browser version, i.e.
   * "latest", "latest-2", "48.0".
   * @param {Object} options Any options that you wish to set on the browser
   * that are for Sauce Labs rather than configuration of the browser.
   * @return {SauceLabsBrowser} A selenium-assistant web driver instance.
   *
   * @example
   * seleniumAssistant.setSaucelabsDetails(myusername, myaccesskey);
   * seleniumAssistant.startSaucelabsConnect()
   * .then(() => {
   *   return seleniumAssistant.getSauceLabsBrowser('microsoftedge', 'latest');
   * })
   * .then((browserInstance) => {
   *   return browserInstance.getSeleniumDriver();
   * })
   * .then((driver) => {
   *   return driver.get('http://localhost:8080/')
   *   .then(() => {
   *     return seleniumAssistant.killWebDriver(driver);
   *   });
   * })
   * .then(() => {
   *   return seleniumAssistant.stopSaucelabsConnect();
   * });
   */
  getSauceLabsBrowser(browserId, browserVersion, options) {
    if (!options) {
      options = {};
    }

    if (!options.saucelabs || !options.saucelabs.username ||
      !options.saucelabs.accessKey) {
      options.saucelabs = application.getSaucelabsDetails();
    }

    return browserManager.getSauceLabsBrowser(browserId, browserVersion,
        options);
  }

  /**
   * The Sauce Labs proxy allows a browser running on Sauce Labs to load
   * a localhost site.
   *
   * Calling this method will start the Sauce Labs connect proxy.
   *
   * @return {Promise} Returns a promise that resolves once the proxy is
   * set up.
   */
  startSaucelabsConnect() {
    return application.startSaucelabsConnect();
  }

  /**
   * The Sauce Labs proxy allows a browser running on Sauce Labs to load
   * a localhost site.
   *
   * Calling this method will stop the Sauce Labs connect proxy.
   *
   * @return {Promise} Returns a promise that resolves once the proxy is closed.
   */
  stopSaucelabsConnect() {
    return application.stopSaucelabsConnect();
  }

  /**
   * Once a web driver is no longer needed, call this method to kill it.
   *
   * This is a basic helper that adds a timeout to the end of killling the
   * driver to account for shutdown time and the issues that can be caused
   * if a new driver is launched too soon before the previous end of a driver.
   *
   * @param  {WebDriver} driver An instance of {@link https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html|WebDriver}
   * @return {Promise} Promise that resolves once the browser is killed.
   */
  killWebDriver(driver) {
    if (typeof driver === 'undefined' || driver === null) {
      return Promise.resolve();
    }

    if (!driver.quit || typeof driver.quit !== 'function') {
      return Promise.reject(new Error('Unable to find a quit method on the ' +
        'web driver.'));
    }

    // Sometimes calling driver.quit() on Chrome, doesn't work,
    // so this timeout offers a semi-decent fallback
    let quitTimeout;
    return new Promise((resolve) => {
      quitTimeout = setTimeout(resolve, 2000);

      driver.close()
          .then(() => driver.quit(), () => driver.quit())
          .then(resolve, resolve);
    })
        .then(() => {
          clearTimeout(quitTimeout);

          return new Promise((resolve, reject) => {
            setTimeout(resolve, 2000);
          });
        });
  }
}

/**
 * Requiring the SeleniumAssistant node module will give you an instance of
 * the {@link SeleniumAssistant} class.
 *
 * @module selenium-assistant
 *
 * @example <caption>Usage in Node</caption>
 * const seleniumAssistant = require('selenium-assistant');
 *
 * const browsers = seleniumAssistant.getLocalBrowsers();
 * browsers.map(browser => {
 *   console.log(browsers.getPrettyName());
 *   console.log(browsers.getReleaseName());
 *
 *   return browser.getSeleniumDriver()
 *   .then((driver) => {
 *     return driver.get('https://google.com/')
 *     .then(() => {
 *      return seleniumAssistant.killWebDriver(driver);
 *     });
 *   });
 * });
 */
module.exports = new SeleniumAssistant();
