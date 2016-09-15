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
const seleniumOpera = require('selenium-webdriver/opera');
const WebDriverBrowser = require('./web-driver-browser');
const application = require('../application-state.js');

/**
 * <p>Handles the prettyName and executable path for Opera browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class OperaWebDriverBrowser extends WebDriverBrowser {
  /**
   * Create an Opera representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param  {String} release The channel of Opera you want to get, either
   *                          'stable', 'beta' or 'unstable'
   */
  constructor(release) {
    let prettyName = 'Opera';

    if (release === 'stable') {
      prettyName += ' Stable';
    } else if (release === 'beta') {
      prettyName += ' Beta';
    } else if (release === 'unstable') {
      prettyName += ' Developer';
    }

    super(
      prettyName,
      release,
      'opera',
      new seleniumOpera.Options()
    );
  }

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
    } catch (err) {}

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
      console.warn(chalk.red('Warning:') + ' Unable to parse version number ' +
        'from Opera: ', this.getExecutablePath());
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }
}

module.exports = OperaWebDriverBrowser;
