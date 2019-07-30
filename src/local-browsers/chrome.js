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
const path = require('path');
const which = require('which');
const webdriver = require('selenium-webdriver');

const LocalBrowser = require('../browser-models/local-browser.js');
const application = require('../application-state.js');
const ChromeConfig = require('../webdriver-config/chrome.js');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class LocalChromeBrowser extends LocalBrowser {
  /**
   * Create a Chrome representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param {String} release The release name for this browser instance.
   */
  constructor(release) {
    super(new ChromeConfig(), release);
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
    seleniumOptions.setChromeBinaryPath(this.getExecutablePath());

    const builder = new webdriver
        .Builder()
        .withCapabilities(this._capabilities)
        .forBrowser(this.getId())
        .setChromeOptions(seleniumOptions);

    return builder;
  }

  /**
   * @return {string|null} The install directory with selenium-assistant's
   * reserved directory for installing browsers and operating files.
   */
  _findInInstallDir() {
    const defaultDir = application.getInstallDirectory();
    let expectedPath;
    if (process.platform === 'linux') {
      let chromeSubPath = 'chrome/google-chrome';
      if (this._release === 'beta') {
        chromeSubPath = 'chrome-beta/google-chrome-beta';
      }

      expectedPath = path.join(
          defaultDir, 'chrome', this._release, 'opt/google/',
          chromeSubPath);
    } else if (process.platform === 'darwin') {
      let chromeAppName = 'Google Chrome';
      if (this._release === 'beta') {
        chromeAppName = 'Google Chrome';
      }

      expectedPath = path.join(
          defaultDir, 'chrome', this._release, chromeAppName + '.app',
          'Contents/MacOS/' + chromeAppName
      );
    }

    try {
      // This will throw if it's not found
      fs.lstatSync(expectedPath);
      return expectedPath;
    } catch (error) {
      // NOOP
    }

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
      switch (process.platform) {
        case 'darwin':
          // Chrome on OS X
          switch (this._release) {
            case 'stable':
              return '/Applications/Google Chrome.app/' +
                'Contents/MacOS/Google Chrome';
            case 'beta':
              return '/Applications/Google Chrome Beta.app/' +
                'Contents/MacOS/Google Chrome Beta';
            default:
              throw new Error('Unknown release: ' + this._release);
          }
        case 'linux':
          // Chrome on linux
          switch (this._release) {
            case 'stable':
              return which.sync('google-chrome');
            case 'beta':
              return which.sync('google-chrome-beta');
            default:
              throw new Error('Unknown release: ' + this._release);
          }
        default:
          throw new Error('Sorry, this platform isn\'t supported');
      }
    } catch (err) {
      // NOOP
    }

    return null;
  }

  /**
   * A version number for the browser. This is the major version number
   * (i.e. for 48.0.1293, this would return 18)
   * @return {Integer} The major version number of this browser
   */
  getVersionNumber() {
    const chromeVersion = this.getRawVersionString();
    if (!chromeVersion) {
      return -1;
    }

    const regexMatch = chromeVersion.match(/(\d+)\.\d+\.\d+\.\d+/);
    if (regexMatch === null) {
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  /**
   * Get the minimum support version of Chrome with selenium-assistant.
   * @return {number} Minimum supported Chrome version.
   */
  _getMinSupportedVersion() {
    // ChromeDriver only works on Chrome 47+
    return 47;
  }

  /**
   * This method returns the pretty names for each browser release.
   * @return {Object} An object containing on or move of 'stable', 'beta' or
   * 'unstable' keys with a matching name for that release.
   */
  static getPrettyReleaseNames() {
    return {
      stable: 'Stable',
      beta: 'Beta',
    };
  }
}

module.exports = LocalChromeBrowser;
