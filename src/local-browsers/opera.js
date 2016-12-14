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
const semver = require('semver');

const LocalBrowser = require('../browser-models/local-browser.js');
const application = require('../application-state.js');
const OperaConfig = require('../webdriver-config/opera.js');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class LocalOperaBrowser extends LocalBrowser {
  /**
   * Create a Chrome representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param {String} release The release name for this browser instance.
   */
  constructor(release) {
    const blacklist = {
      41: '0.2.2',
      42: '0.2.2',
      43: '0.2.2',
    };
    super(new OperaConfig(), release, blacklist);
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
    seleniumOptions.setOperaBinaryPath(this.getExecutablePath());

    const builder = new webdriver
      .Builder()
      .withCapabilities(this._capabilities)
      .forBrowser(this.getId())
      .setOperaOptions(seleniumOptions);

    return builder;
  }

  /**
   * @return {string|null} The install directory with selenium-assistant's
   * reserved directory for installing browsers and operating files.
   */
  _findInInstallDir() {
    let defaultDir = application.getInstallDirectory();
    let expectedPath;
    if (process.platform === 'linux') {
      let operaBinary = 'opera';
      if (this._release === 'beta') {
        operaBinary = 'opera-beta';
      } else if (this._release === 'unstable') {
        operaBinary = 'opera-developer';
      }

      expectedPath = path.join(
        defaultDir, 'opera', this._release, 'usr/bin', operaBinary);
    } else if (process.platform === 'darwin') {
      // Can't control where Opera is installed due to installer.
      // Just use global path
      return null;
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
      if (this._release === 'stable') {
        if (process.platform === 'darwin') {
          return '/Applications/Opera.app/' +
            'Contents/MacOS/Opera';
        } else if (process.platform === 'linux') {
          return which.sync('opera');
        }
      } else if (this._release === 'beta') {
        if (process.platform === 'darwin') {
          return '/Applications/Opera Beta.app/' +
            'Contents/MacOS/Opera';
        } else if (process.platform === 'linux') {
          return which.sync('opera-beta');
        }
      } else if (this._release === 'unstable') {
        if (process.platform === 'darwin') {
          return '/Applications/Opera Developer.app/' +
            'Contents/MacOS/Opera';
        } else if (process.platform === 'linux') {
          return which.sync('opera-developer');
        }
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
    const operaVersion = this.getRawVersionString();
    if (!operaVersion) {
      return -1;
    }

    const regexMatch = operaVersion.match(/(\d+)\.\d+\.\d+\.\d+/);
    if (regexMatch === null) {
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  /**
   * The blacklist allows blocking use of a browser with
   * a specific version with a particular driver version.
   * @return {Boolean} Whether to blacklist this browser.
   */
  isBlackListed() {
    if (!this._blacklist) {
      return false;
    }

    try {
      const browserVersion = this.getVersionNumber();
      if (!this._blacklist[browserVersion]) {
        return false;
      }

      const minBrokenDriverModule = this._blacklist[browserVersion];
      const driverModule = require(this.getDriverModule());
      if (semver.gt(driverModule.version, minBrokenDriverModule)) {
        return false;
      }
    } catch (err) {
      // If we can validate the blacklist, chances are the browser is invalid
      // with current selenium.
    }
    return true;
  }

  /**
   * This method returns the pretty names for each browser releace.
   * @return {Object} An object containing on or move of 'stable', 'beta' or
   * 'unstable' keys with a matching name for that release.
   */
  static getPrettyReleaseNames() {
    return {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Developer',
    };
  }
}

module.exports = LocalOperaBrowser;
