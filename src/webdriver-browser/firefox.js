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

const which = require('which');
const path = require('path');
const seleniumFirefox = require('selenium-webdriver/firefox');
const WebDriverBrowser = require('./web-driver-browser');
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

  getExecutablePath() {
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
      if (process.env.FF_BETA_PATH) {
        return process.env.FF_BETA_PATH;
      }

      // Last ditch attempt to find ff beta installed
      // with project/downloads/firefox-beta.sh
      return path.join(__dirname, '..', '..', '..', 'firefox-beta',
        'firefox');
    } else if (this._release === 'unstable') {
      if (process.env.FF_NIGHTLY_PATH) {
        return process.env.FF_NIGHTLY_PATH;
      } else if (process.platform === 'darwin') {
        return '/Applications/FirefoxNightly.app/Contents/MacOS/firefox';
      }

      // Last ditch attempt to find ff beta installed
      // with project/downloads/firefox-nightly.sh
      return path.join(__dirname, '..', '..', '..', 'firefox-nightly',
        'firefox');
    }

    return null;
  }

  getVersionNumber() {
    const firefoxVersion = this.getRawVersionString();
    const regexMatch = firefoxVersion.match(/(\d\d).\d/);
    if (regexMatch === null) {
      console.warn('Unable to parse version number from Firefox',
        this._executablePath);
      return false;
    }

    return parseInt(regexMatch[1], 10);
  }
}

module.exports = FirefoxWebDriverBrowser;
