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
const chalk = require('chalk');
const seleniumSafari = require('selenium-webdriver/safari');
const WebDriverBrowser = require('./web-driver-browser');

/**
 * <p>Handles the prettyName and executable path for Safari browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class SafariWebDriverBrowser extends WebDriverBrowser {
  /**
   * Create an Safari representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param  {String} release The channel of Opera you want to get, either
   *                          'stable', 'beta' or 'unstable'
   */
  constructor(release) {
    let prettyName = 'Safari';

    if (release === 'stable') {
      prettyName += ' Stable';
    } else if (release === 'beta') {
      prettyName += ' Technology Preview';
    } else if (release === 'unstable') {
      throw new Error('Only stable and beta versions available ' +
      'for this browser');
    }

    super(
      prettyName,
      release,
      'safari',
      new seleniumSafari.Options()
    );
  }

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
            'Contents/MacOS/Safari Technology Preview'
        }
      }
    } catch (err) {}

    return null;
  }

  getRawVersionString() {
    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return null;
    }

    let versionListPath;
    if (this._release === 'stable') {
      versionListPath = '/Applications/Safari.app/Contents/version.plist';
    } else if (this._release === 'beta') {
      versionListPath = '/Applications/Safari Technology Preview.app/Contents/version.plist';
    }
    try {
      const versionDoc = fs.readFileSync(versionList).toString();
      /* eslint-disable no-useless-escape */
      const results = new RegExp(
        '<key>CFBundleShortVersionString</key>' +
        '[\\s]+<string>([\\d]+.[\\d]+.[\\d]+)</string>', 'g')
      .exec(versionDoc);
      /* eslint-enable no-useless-escape */
      if (results) {
        return results[1];
      }
    } catch (err) {
      console.warn(chalk.red('WARNING') + ': Unable to get a version string ' +
        'for ' + this.getPrettyName());
    }

    return null;
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

    const regexMatch = safariVersion.match(/(\d+)\.\d+\.\d+/);
    if (regexMatch === null) {
      console.warn(chalk.red('Warning:') + ' Unable to parse version number ' +
        'from Safari: ', this.getExecutablePath());
      return -1;
    }

    return parseInt(regexMatch[1], 10);
  }

  static getAvailableReleases() {
    return ['stable', 'beta'];
  }
}

module.exports = SafariWebDriverBrowser;
