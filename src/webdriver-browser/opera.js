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
const operaOptions = require('selenium-webdriver/opera');
const WebDriverBrowser = require('./web-driver-browser');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class OperaWebDriverBrowser extends WebDriverBrowser {
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
      new operaOptions.Options()
    );
  }

  _getExecutablePath() {
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

  getVersionNumber() {
    const operaVersion = this.getRawVersionString();
    const regexMatch = operaVersion.match(/(\d+).\d+.\d+.\d+/);
    if (regexMatch === null) {
      console.warn('Unable to parse version number from Opera',
        this._executablePath);
      return false;
    }

    return parseInt(regexMatch[1], 10);
  }
}

module.exports = OperaWebDriverBrowser;
