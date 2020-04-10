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
const webdriver = require('selenium-webdriver');
const safari = require('selenium-webdriver/safari');

const LocalBrowser = require('../browser-models/local-browser.js');
const SafariConfig = require('../webdriver-config/safari.js');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class LocalSafariBrowser extends LocalBrowser {
  /**
   * Create a Chrome representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param {String} release The release name for this browser instance.
   */
  constructor(release) {
    super(new SafariConfig(), release);
  }

  /**
   * <p>This method returns the preconfigured builder used by
   * getSeleniumDriver().</p>
   *
   * <p>This is useful if you wish to customise the builder with additional
   * options (i.e. customise the proxy of the driver.)</p>
   *
   * <p>For more info, see:
   * {@link https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html | WebDriverBuilder Docs}</p>
   *
   * @return {WebDriverBuilder} Builder that resolves to a webdriver instance.
   */
  getSeleniumDriverBuilder() {
    const seleniumOptions = this.getSeleniumOptions();
    seleniumOptions.setTechnologyPreview((this._release === 'beta'));

    let builder = new webdriver
        .Builder()
        .withCapabilities(this._capabilities)
        .forBrowser(this.getId())
        .setSafariOptions(seleniumOptions);

    // Run Safari 12 in legacy mode due to
    // https://github.com/SeleniumHQ/selenium/issues/6026
    // This is not needed in Safari 13+.
    if (this.getVersionNumber() === 12) {
      builder = builder.usingServer(
          new safari.ServiceBuilder().addArguments('--legacy').build().start());
    }

    return builder;
  }

  /**
   * @return {string|null} The install directory with selenium-assistant's
   * reserved directory for installing browsers and operating files.
   */
  _findInInstallDir() {
    return null;
  }

  /**
   * Returns the executable for the browser
   * @return {String} Path of executable
   */
  getExecutablePath() {
    const installDirExecutable = this._findInInstallDir();
    if (installDirExecutable) {
      // We have a path for the browser
      return installDirExecutable;
    }

    try {
      if (this._release === 'stable') {
        if (process.platform === 'darwin') {
          return '/Applications/Safari.app/' +
            'Contents/MacOS/Safari';
        }
      } else if (this._release === 'beta') {
        if (process.platform === 'darwin') {
          return '/Applications/Safari Technology Preview.app/' +
            'Contents/MacOS/Safari Technology Preview';
        }
      }
    } catch (err) {
      // NOOP
    }

    return null;
  }

  /**
   * Get the version string from the browser itself. From Safari this is from
   * `version.plist` file.
   * @return {String} The version string for this Safari release.
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

    let versionListPath;
    if (this._release === 'stable') {
      versionListPath = '/Applications/Safari.app/Contents/version.plist';
    } else if (this._release === 'beta') {
      versionListPath = '/Applications/Safari Technology Preview.app/' +
        'Contents/version.plist';
    }
    try {
      const versionDoc = fs.readFileSync(versionListPath).toString();
      /* eslint-disable no-useless-escape */
      const results = new RegExp(
          '<key>CFBundleShortVersionString</key>' +
        '[\\s]+<string>([\\d]+.[\\d]+(?:.[\\d]+)?)</string>', 'g')
          .exec(versionDoc);
      /* eslint-enable no-useless-escape */
      if (results) {
        this._rawVerstionString = results[1];
      }
    } catch (err) {
      // NOOP
    }

    return this._rawVerstionString;
  }

  /**
   * A version number for the browser. This is the major version number
   * (i.e. for 48.0.1293, this would return 18)
   * @return {Integer} The major version number of this browser
   */
  getVersionNumber() {
    const safariVersion = this.getRawVersionString();
    if (!safariVersion) {
      return -1;
    }

    const regexMatch = safariVersion.match(/(\d+)\.\d+(?:\.\d+)?/);
    if (regexMatch === null) {
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  /**
   * Get the minimum support version of Safari with selenium-assistant.
   * @return {number} Minimum supported Safari version.
   */
  _getMinSupportedVersion() {
    // Latest SafariDriver only works on Safari 10+
    return 10;
  }

  /**
   * This method returns the pretty names for each browser release.
   * @return {Object} An object containing on or move of 'stable', 'beta' or
   * 'unstable' keys with a matching name for that release.
   */
  static getPrettyReleaseNames() {
    return {
      stable: 'Stable',
      beta: 'Technology Preview',
    };
  }
}

module.exports = LocalSafariBrowser;
