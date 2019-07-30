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
const FirefoxConfig = require('../webdriver-config/firefox.js');

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
    super(new FirefoxConfig(), release);
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
    seleniumOptions.setBinary(this.getExecutablePath());

    const builder = new webdriver
        .Builder()
        .withCapabilities(this._capabilities)
        .forBrowser(this.getId())
        .setFirefoxOptions(seleniumOptions);

    return builder;
  }

  /**
   * @return {string|null} The install directory with selenium-assistant's
   * reserved directory for installing browsers and operating files.
   */
  _findInInstallDir() {
    const defaultDir = application.getInstallDirectory();
    if (process.platform === 'linux') {
      const expectedPath = path.join(
          defaultDir, 'firefox', this._release, 'firefox');

      try {
        // This will throw if it's not found
        fs.lstatSync(expectedPath);
        return expectedPath;
      } catch (error) {
        // NOOP
      }
    } else if (process.platform === 'darwin') {
      // Find OS X expected path
      let firefoxAppName;
      if (this._release === 'unstable') {
        firefoxAppName = 'Firefox Nightly.app';
      } else {
        firefoxAppName = 'Firefox.app';
      }

      const expectedPath = path.join(
          defaultDir, 'firefox', this._release, firefoxAppName,
          'Contents/MacOS/firefox'
      );

      try {
        // This will throw if it's not found
        fs.lstatSync(expectedPath);
        return expectedPath;
      } catch (error) {
        // NOOP
      }
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
          // Firefox Beta on OS X overrides Firefox stable, so realistically
          // this location could return ff stable as beta, but at least it will
          // only be returned once.
          if (this._release === 'stable') {
            return '/Applications/Firefox.app/Contents/MacOS/firefox';
          } else if (this._release === 'unstable') {
            return '/Applications/Firefox Nightly.app/Contents/MacOS/firefox';
          }
          break;
        case 'linux':
          // Stable firefox on Linux is the only known location we can find
          // otherwise it's jsut a .tar.gz that users have to put anywhere
          if (this._release === 'stable') {
            return which.sync('firefox');
          }
          break;
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
    const firefoxVersion = this.getRawVersionString();
    if (!firefoxVersion) {
      return -1;
    }

    const regexMatch = firefoxVersion.match(/(\d+)\.\d/);
    if (regexMatch === null) {
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  /**
   * Get the minimum support version of Firefox with selenium-assistant.
   * @return {number} Minimum supported Firefox version.
   */
  _getMinSupportedVersion() {
    // Firefox Marionette only works on Firefox 47+
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
      unstable: 'Nightly',
    };
  }
}

module.exports = LocalChromeBrowser;
