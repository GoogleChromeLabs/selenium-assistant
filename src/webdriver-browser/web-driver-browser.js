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

const execSync = require('child_process').execSync;
const fs = require('fs');
const chalk = require('chalk');
const webdriver = require('selenium-webdriver');

/**
 * <p>A base class that is designed to be extended to handle browser specific
 * values.</p>
 *
 * <p>An instance of this class helps find and start browsers using selenium.</p>
 *
 * <p>Instances of this class are returned by
 * [automatedBrowserTesting.getDiscoverableBrowsers()]{@link AutomatedBrowserTesting#getDiscoverableBrowsers}</p>
 */
class WebDriverBrowser {
  /**
   * <p>This constructor will throw an error should any of the inputs be
   * invalid / unexpected.</p>
   *
   * @param  {String} prettyName        A user friendly name of the browser
   * @param  {String} release           Release type of browser (can be either
   * 'stable', 'beta' or 'unstable')
   * @param  {String} seleniumBrowserId An id of the browser that will be
   * accepted by selenium (either 'chrome' or 'firefox')
   * @param  {SeleniumOptions} seleniumOptions   This is an instance of either
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  constructor(prettyName, release, seleniumBrowserId, seleniumOptions) {
    if (typeof prettyName !== 'string' || prettyName.length === 0) {
      throw new Error('Invalid prettyName value: ', prettyName);
    }

    if (release !== 'stable' && release !== 'beta' && release !== 'unstable') {
      throw new Error('Unexpected browser release given: ', release);
    }

    if (
      seleniumBrowserId !== 'chrome' &&
      seleniumBrowserId !== 'firefox' &&
      seleniumBrowserId !== 'opera' &&
      seleniumBrowserId !== 'safari'
    ) {
      throw new Error('Unexpected browser ID given: ', seleniumBrowserId);
    }

    this._prettyName = prettyName;
    this._release = release;
    this._seleniumBrowserId = seleniumBrowserId;
    this._seleniumOptions = seleniumOptions;
  }

  /* eslint-disable valid-jsdoc */
  /**
   * To get the path of the browsers executable file, call this method.
   * @return {String} Path of the browsers executable file or null if
   * it can't be found.
   */
  getExecutablePath() {
    throw new Error('getExecutablePath() must be overriden by subclasses');
  }
  /* eslint-enable valid-jsdoc */

  /**
   * If you need to identify a browser based on it's version number but
   * the high level version number isn't specific enough, you can use the
   * raw version string (this will be the result of calling the browser
   * executable with an appropriate flag to get the version)
   * @return {String} Raw string that identifies the browser
   */
  getRawVersionString() {
    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return null;
    }

    try {
      return execSync(`"${executablePath}" --version`)
        .toString();
    } catch (err) {
      console.warn(chalk.red('WARNING') + ': Unable to get a version string ' +
        'for ' + this.getPrettyName());
    }

    return null;
  }

  /* eslint-disable valid-jsdoc */
  /**
   * <p>This method returns an integer if it can be determined from
   * the browser executable or -1 if the version is unknown.</p>
   *
   * <p>A scenario where it will be unable to produce a valid version
   * is if the browsers executable path can't be found.</p>
   *
   * @return {Integer} Version number if it can be found
   */
  getVersionNumber() {
    throw new Error('getVersionNumber() must be overriden by subclasses');
  }
  /* eslint-enable valid-jsdoc */

  _getMinSupportedVersion() {
    return false;
  }

  /**
   * <p>This method returns true if the instance can be found and can create a
   * selenium driver that will launch the expected browser.</p>
   *
   * <p>A scenario where it will be unable to produce a valid selenium driver
   * is if the browsers executable path can't be found.</p>
   *
   * @return {Boolean} True if a selenium driver can be produced
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
        return this.getVersionNumber() >= minVersion;
      }

      return true;
    } catch (error) {}

    return false;
  }

  /**
   * A user friendly name for the browser
   * @return {String} A user friendly name for the browser
   */
  getPrettyName() {
    return this._prettyName;
  }

  /**
   * <p>The release name for this browser, either 'stable', 'beta',
   * 'unstable'.</p>
   *
   * <p>Useful if you only want to test <i>or</i> not test on a particular release
   * type.</p>
   * @return {String} Release name of browser. 'stable', 'beta' or 'unstable'
   */
  getReleaseName() {
    return this._release;
  }

  /**
   * This returns the browser ID that Selenium recognises.
   *
   * @return {String} The Selenium ID of this browser
   */
  getSeleniumBrowserId() {
    return this._seleniumBrowserId;
  }

  /**
   * The selenium options passed to webdriver's `Builder` method. This
   * will have the executable path set for the browser so you should
   * manipulate these options rather than create entirely new objects.
   *
   * @return {SeleniumOptions} An instance of either
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  getSeleniumOptions() {
    return this._seleniumOptions;
  }

  /**
   * If changes are made to the selenium options, call this method to
   * set them before calling {@link getSeleniumDriver}.
   * @param {SeleniumOptions} options An instance of
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  setSeleniumOptions(options) {
    this._seleniumOptions = options;
  }

  /**
   * <p>This method returns the preconfigured builder used by getSeleniumDriver().</p>
   *
   * <p>This is useful if you wish to customise the builder with additional options
   * (i.e. customise the proxy of the driver.)</p>
   *
   * <p>For more info, see:
   * {@link https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html | WebDriverBuilder Docs}</p>
   *
   * @return {WebDriverBuilder} Builder that resolves to a webdriver instance.
   */
  getSeleniumDriverBuilder() {
    const seleniumOptions = this.getSeleniumOptions();

    if (seleniumOptions.setChromeBinaryPath) {
      seleniumOptions.setChromeBinaryPath(this.getExecutablePath());
    } else if (seleniumOptions.setOperaBinaryPath) {
      seleniumOptions.setOperaBinaryPath(this.getExecutablePath());
    } else if (seleniumOptions.setBinary) {
      seleniumOptions.setBinary(this.getExecutablePath());
    } else if (seleniumOptions.setCleanSession) {
      // This is a safari options, there is no way we can define
      // an executable path :(
    } else {
      throw new Error('Unknown selenium options object');
    }

    return new webdriver
      .Builder()
      .forBrowser(this.getSeleniumBrowserId())
      .setChromeOptions(seleniumOptions)
      .setFirefoxOptions(seleniumOptions)
      .setOperaOptions(seleniumOptions)
      .setSafariOptions(seleniumOptions)
      .setEdgeOptions(seleniumOptions);
  }

  /**
   * <p>This method resolves to a webdriver instance of this browser instance.</p>
   *
   * <p>For more info, see:
   * {@link http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebDriver.html | WebDriver Docs}</p>
   *
   * @return {Promise<WebDriver>} [description]
   */
  getSeleniumDriver() {
    try {
      const builder = this.getSeleniumDriverBuilder();
      return builder.buildAsync();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static getAvailableReleases() {
    return ['stable', 'beta', 'unstable'];
  }
}

module.exports = WebDriverBrowser;
