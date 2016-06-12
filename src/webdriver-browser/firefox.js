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
const seleniumFirefox = require('selenium-webdriver/firefox');
const WebDriverBrowser = require('./web-driver-browser');
const application = require('../application-state.js');

/**
 * <p>Handles the prettyName and executable path for Firefox browser.</p>
 *
 * <p>For Firefox Beta and Firefox Nightly please define FF_BETA_PATH and
 * FF_NIGHTLY_PATH as environment variables. This is due to Firefox using
 * the same executable name for all releases.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class FirefoxWebDriverBrowser extends WebDriverBrowser {
  /**
   * Pass in the release version this instance should represent and it will
   * try to find the browser in the current environment and set up a new
   * {@link WebDriverBrowser} instance.
   * @param  {String} release The name of the release this instance should
   * represent. Either 'stable', 'beta' or 'unstable'.
   */
  constructor(release) {
    let prettyName = 'Firefox';

    const ffOptions = new seleniumFirefox.Options();
    // Required since v47
    ffOptions.useMarionette(true);

    if (release === 'stable') {
      prettyName += ' Stable';
    } else if (release === 'beta') {
      prettyName += ' Beta';
    } else if (release === 'unstable') {
      prettyName += ' Nightly';
    }

    super(
      prettyName,
      release,
      'firefox',
      ffOptions
    );
  }

  _findInInstallDir() {
    let defaultDir = application.getInstallDirectory();
    const expectedPath = path.join(
      defaultDir, 'firefox', this._release, 'firefox');
    try {
      // This will throw if it's not found
      fs.lstatSync(expectedPath);
      return expectedPath;
    } catch (error) {}
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
        if (process.env.FF_STABLE_PATH) {
          return process.env.FF_STABLE_PATH;
        }

        if (process.platform === 'darwin') {
          return '/Applications/Firefox.app/Contents/MacOS/firefox';
        } else if (process.platform === 'linux') {
          return which.sync('firefox');
        }
      } else if (this._release === 'beta') {

      } else if (this._release === 'unstable') {
        if (process.platform === 'darwin') {
          return '/Applications/FirefoxNightly.app/Contents/MacOS/firefox';
        }
      }
    } catch (err) {}

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

    const regexMatch = firefoxVersion.match(/(\d\d).\d/);
    if (regexMatch === null) {
      console.warn('Unable to parse version number from Firefox',
        this.getExecutablePath());
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }
}

module.exports = FirefoxWebDriverBrowser;
