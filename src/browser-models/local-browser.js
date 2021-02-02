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
const execSync = require('child_process').execSync;
const Browser = require('./browser.js');

/**
 * The LocalBrowser class is an abstract class that is overriden by
 * browser classes that are supported (Chrome, Firefox and Safari).
 * @extends Browser
 */
class LocalBrowser extends Browser {
  /**
   * Construct a new local browser.
   *
   * @param {DriverConfig} config The config for the browser.
   * @param {String} release Release name of the browser, must be 'stable',
   * 'beta' or 'unstable'.
   * @param {Object} denylist This is a list of browser versions => driver
   * versions which is used to deny a browser from being made available. This
   * is not assurance of a browser working but may be used more actively
   * to block bad browser support in the future.
   */
  constructor(config, release, denylist) {
    super(config);

    if (typeof config._prettyName !== 'string' ||
      config._prettyName.length === 0) {
      throw new Error('Invalid prettyName value: ', config._prettyName);
    }

    if (release !== 'stable' && release !== 'beta' && release !== 'unstable') {
      throw new Error('Unexpected browser release given: ', release);
    }

    this._prettyName = `${config._prettyName}`;

    const releaseNames = this.constructor.getPrettyReleaseNames();
    if (releaseNames[release]) {
      this._prettyName += ` ${releaseNames[release]}`;
    }

    this._release = release;
    this._denylist = denylist;
  }

  /**
   * This method returns true if the browser executable can be found and the
   * browser version is expected to work with the current installed browser
   * driver, otherwise false is returned.
   *
   * @return {Boolean} True if a WebDriver can be built and used.
   */
  isValid() {
    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return false;
    }

    try {
      // This will throw if it's not found
      fs.lstatSync(executablePath);

      const minVersion = this._getMinSupportedVersion();
      if (minVersion) {
        const browserVersion = this.getVersionNumber();
        if (browserVersion !== -1 && browserVersion < minVersion) {
          return false;
        }
      }

      if (this.isDenyListed()) {
        return false;
      }

      return true;
    } catch (error) {
      // NOOP
    }

    return false;
  }

  /**
   * This method is largely used internally to determine if a browser should
   * be made available or not.
   *
   * This method will only denylist a browser if there is a known bad browser
   * + driver module combination.
   *
   * @return {Boolean} Whether this browser is denylisted or not from being
   * included in available browsers.
   */
  isDenyListed() {
    return false;
  }

  /**
   * A user friendly name for the browser. This is largely useful for
   * console logging. LocalBrowsers will also include the appropriate release
   * name.
   * @return {String} A user friendly name for the browser.
   */
  getPrettyName() {
    return this._prettyName;
  }

  /**
   * This is the raw output of a browsers version number (i.e. running the
   * browser executable with `--version`).
   *
   * This provides more information than major release number returned by
   * [getVersionNumber()]{@link LocalBrowser#getVersionNumber}.
   *
   * @return {String} Raw string of the browser version.
   */
  getRawVersionString() {
    if (this._rawVerstionString) {
      return this._rawVerstionString;
    }

    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return null;
    }

    this._rawVerstionString = null;

    try {
      this._rawVerstionString = execSync(`"${executablePath}" --version`)
          .toString();
    } catch (err) {
      // NOOP
    }

    return this._rawVerstionString;
  }

  /**
   * This method resolves to a raw WebDriver instance.
   *
   * @return {Promise<WebDriver>} A WebDriver Instance, see [selenium-webdriver.ThenableWebDriver]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html} for more info.
   */
  getSeleniumDriver() {
    if (this.getDriverModule()) {
      try {
        // This will require the necessary driver module that will add the
        // driver executable to the current path.
        require(this.getDriverModule());
      } catch (err) {
        // NOOP
      }
    }

    try {
      const builder = this.getSeleniumDriverBuilder();
      let buildResult = builder.build();
      if (!buildResult.then) {
        buildResult = Promise.resolve(buildResult);
      }

      return buildResult
          .then((driver) => {
            // Enable async execution out of the box.
            const timeout = 30 * 1000;
            driver.manage().setTimeouts({
              implicit: timeout,
              pageLoad: timeout,
              script: timeout,
            });

            return driver;
          });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * @private
   * @return {number} The minimum supported version number.
   */
  _getMinSupportedVersion() {
    return false;
  }

  /**
   * The release name for this browser. This will be either 'stable', 'beta' or
   * 'unstable'.
   *
   * Useful if you only want to test, <i>or</i> not test, on a particular
   * release type, i.e. only test of stable releases of browsers.
   *
   * @return {String} Release name of this browser. 'stable', 'beta' or
   * 'unstable'.
   */
  getReleaseName() {
    return this._release;
  }

  //
  // Disabling eslint for JSDoc here as I want to document the return
  // types of the LocalBrowser without labelling the methods as
  // abstract in the docs.
  //

  /* eslint-disable valid-jsdoc */
  /**
   * Get the path of the browser executable if known.
   * @return {String|null} The path of the browsers executable. Null if
   * it's unknown.
   */
  getExecutablePath() {
    throw new Error('getExecutablePath() must be overriden by subclasses');
  }

  /**
   * This returns an object consisting of the supported releases and the
   * matching browser release name.
   *
   * For example, Chrome is:
   * `{ stable: 'Stable', beta: 'Beta' }`
   *
   * @return {Object} Returns an object containing release names as keys and
   * a user friendly release name as the value.
   */
  static getPrettyReleaseNames() {
    throw new Error('getPrettyReleaseNames() must be overriden by ' +
      'subclasses');
  }

  /**
   * The major version of the browser if known.
   * @return {Integer} Major version number of this browser if it can be found,
   * -1 otherwise.
   */
  getVersionNumber() {
    throw new Error('getVersionNumber() must be overriden by subclasses');
  }
  /* eslint-enable valid-jsdoc */
}

module.exports = LocalBrowser;
