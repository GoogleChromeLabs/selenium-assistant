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

const browserManager = require('./browser-manager.js');
const downloadManager = require('./download-manager.js');

/**
 * SeleniumWrapper is a class that makes
 * it easier to launch a browser and run mocha tests.
 *
 * @example <caption>Usage in Node</caption>
 * const seleniumWrapper = require('selenium-wrapper');
 * seleniumWrapper.printAvailableBrowsers();
 *
 * const browsers = seleniumWrapper.getAvailableBrowsers();
 * browsers.forEach(browser => {
 *   console.log(browsers.getPrettyName());
 *   console.log(browsers.getReleaseName());
 * });
 */
class SeleniumWrapper {

  constructor() {
    this._installDir = null;
  }

  /**
   * This returns the path of where browsers are downloaded to.
   * @return {String} Path of downloaded browsers
   */
  getBrowserInstallDir() {
    return this._installDir;
  }

  /**
   * To change where browsers are downloaded to, call this method
   * before calling {@link downloadBrowser}.
   * @param {String} newInstallDir Path to download browsers to. Pass in
   *                               null to use default path.
   */
  setBrowserInstallDir(newInstallDir) {
    this._installDir = newInstallDir;
  }

  /**
   * <p>The download browser is a helper method what will grab a browser
   * on a specific track.</p>
   *
   * <p>If the request browser is already installed, it will resolve
   * the promise and not download anything.</p>
   *
   * <p>This is somewhat experimental, so be prepared for issues.</p>
   *
   * @param  {String} browserId The selenium id of the browser you wish
   *                            to download.
   * @param  {String} release   String of the release channel, can be
   *                            'stable', 'beta' or 'unstable'
   * @param  {Boolean} [force=false]  Force download of a browser
   * @return {Promise}          A promise is returned which resolves
   *                            once the browser has been downloaded.
   */
  downloadBrowser(browserId, release, force) {
    return downloadManager.downloadBrowser(browserId, release, {
      installDir: this.getBrowserInstallDir(),
      force: force
    });
  }

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
  getAvailableBrowsers() {
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      throw new Error('Sorry this library only supports OS X and Linux.');
    }

    let webdriveBrowsers = browserManager.getSupportedBrowsers();
    webdriveBrowsers = webdriveBrowsers.filter(webdriverBrowser => {
      if (!webdriverBrowser.isValid()) {
        return false;
      }

      return true;
    });

    return webdriveBrowsers;
  }

  /**
   * <p>This method prints out a table of info for all available browsers
   * on the current environment.</p>
   *
   * <p>Useful if you are testing on travis and what to see what tests
   * should be running on.</p>
   *
   * @param {Boolean} [printToConsole=true] - If you wish to prevent
   * the table being printed to the console, you can suppress it by
   * passing in false.
   * @return {String} Returns table of information as a string.
   */
  printAvailableBrowserInfo(printToConsole) {
    if (typeof printToConsole === 'undefined') {
      printToConsole = true;
    }

    var browsers = this.getAvailableBrowsers();
    const rows = [];
    rows.push([
      'Browser Name',
      'Browser Version',
      'Path'
    ]);

    browsers.forEach(browser => {
      rows.push([
        browser.getPrettyName(),
        browser.getVersionNumber().toString(),
        browser.getExecutablePath()
      ]);
    });

    const noOfColumns = rows[0].length;
    const rowLengths = [];
    for (let i = 0; i < noOfColumns; i++) {
      let currentRowMaxLength = 0;
      rows.forEach(row => {
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
      let coloredRows = row.map((column, columnIndex) => {
        const padding = rowLengths[columnIndex] - column.length;
        if (padding > 0) {
          return color(column) + ' '.repeat(padding);
        }
        return color(column);
      });

      let rowString = coloredRows.join(' | ');

      outputString += '| ' + rowString + ' |\n';
    });

    outputString += chalk.gray('-'.repeat(totalRowLength)) + '\n';

    if (printToConsole) {
      console.log(outputString);
    }

    return outputString;
  }

  /**
   * Once a web driver is no longer needed call this method to kill it. The
   * promise resolves once the browser is closed and clean up has been done.
   * @param  {WebDriver} driver Instance of a {@link http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebDriver.html | WebDriver}
   * @return {Promise}          Promise that resolves once the browser is killed.
   */
  killWebDriver(driver) {
    return new Promise((resolve, reject) => {
      if (typeof driver === 'undefined' ||
        driver === null) {
        return resolve();
      }

      if (!driver.quit || typeof driver.quit !== 'function') {
        reject(new Error('Unable to find a quit method on the web driver.'));
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

module.exports = new SeleniumWrapper();
