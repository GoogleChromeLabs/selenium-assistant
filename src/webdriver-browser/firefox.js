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
const chalk = require('chalk');
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
      new seleniumFirefox.Options()
    );
  }

  _findInInstallDir() {
    let defaultDir = application.getInstallDirectory();
    if (process.platform === 'linux') {
      const expectedPath = path.join(
        defaultDir, 'firefox', this._release, 'firefox');

      try {
        // This will throw if it's not found
        fs.lstatSync(expectedPath);
        return expectedPath;
      } catch (error) {}
    } else if (process.platform === 'darwin') {
      // Find OS X expected path
      let firefoxAppName;
      if (this._release === 'unstable') {
        firefoxAppName = 'FirefoxNightly.app';
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
      } catch (error) {}
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
            return '/Applications/FirefoxNightly.app/Contents/MacOS/firefox';
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

    const regexMatch = firefoxVersion.match(/(\d+)\.\d/);
    if (regexMatch === null) {
      console.warn(chalk.red('Warning:') + ' Unable to parse version number ' +
        'from Firefox: ', this.getExecutablePath());
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  _getMinSupportedVersion() {
    // Firefox Marionette only works on Firefox 47+
    return 47;
  }
}

module.exports = FirefoxWebDriverBrowser;
