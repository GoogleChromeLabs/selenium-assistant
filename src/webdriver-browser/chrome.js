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
const seleniumChrome = require('selenium-webdriver/chrome');
const WebDriverBrowser = require('./web-driver-browser');
const application = require('../application-state.js');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class ChromeWebDriverBrowser extends WebDriverBrowser {
  constructor(release) {
    let prettyName = 'Google Chrome';

    if (release === 'stable') {
      prettyName += ' Stable';
    } else if (release === 'beta') {
      prettyName += ' Beta';
    } else if (release === 'unstable') {
      prettyName += ' Dev';
    }

    super(
      prettyName,
      release,
      'chrome',
      new seleniumChrome.Options()
    );
  }

  _findInInstallDir() {
    let defaultDir = application.getInstallDirectory();
    let expectedPath;
    if (process.platform === 'linux') {
      let chromeSubPath = 'chrome/google-chrome';
      if (this._release === 'beta') {
        chromeSubPath = 'chrome-beta/google-chrome-beta';
      } else if (this._release === 'unstable') {
        chromeSubPath = 'chrome-unstable/google-chrome-unstable';
      }

      expectedPath = path.join(
        defaultDir, 'chrome', this._release, 'opt/google/',
        chromeSubPath);
    } else if (process.platform === 'darwin') {
      let chromeAppName = 'Google Chrome';
      if (this._release === 'beta') {
        chromeAppName = 'Google Chrome';
      } else if (this._release === 'unstable') {
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
            case 'unstable':
              return '/Applications/Google Chrome Dev.app/' +
                'Contents/MacOS/Google Chrome Dev';
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
            case 'unstable':
              return which.sync('google-chrome-unstable');
            default:
              throw new Error('Unknown release: ' + this._release);
          }
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
    const chromeVersion = this.getRawVersionString();
    if (!chromeVersion) {
      return -1;
    }

    const regexMatch = chromeVersion.match(/(\d+)\.\d+\.\d+\.\d+/);
    if (regexMatch === null) {
      console.warn(chalk.red('Warning:') + ' Unable to parse version number ' +
        'from Chrome: ', this.getExecutablePath());
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  _getMinSupportedVersion() {
    // ChromeDriver only works on Chrome 47+
    return 47;
  }
}

module.exports = ChromeWebDriverBrowser;
