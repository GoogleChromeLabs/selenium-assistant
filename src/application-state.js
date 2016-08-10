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

const path = require('path');

/**
 * This class is a super basic class that stores shared state across the
 * classes in this library / module.
 *
 * @private
 */
class ApplicationState {
  constructor() {
    this._installDir = this.getDefaultInstallLocation();
    this._addGeckoDriverToPath();
  }

  /**
   * This method is required until geckodriver can be installed
   * and added to the path as an NPM module.
   */
  _addGeckoDriverToPath() {
    // Add geckodriver's path to process path
    process.env.PATH += ':' + path.join(this._installDir, 'geckodriver');
  }

  /**
   * To define where browsers should be installed and searched for,
   * define the path by calling this method.
   * @param {String} newInstallDir The path to install new browsers in to.
   */
  setInstallDirectory(newInstallDir) {
    if (newInstallDir) {
      this._installDir = path.resolve(newInstallDir);
    } else {
      this._installDir = this.getDefaultInstallLocation();
    }

    this._addGeckoDriverToPath();
  }

  /**
   * To get ther current path of where Browsers are installed and searched for,
   * call this method.
   * @return {String} The current path for installed browsers.
   */
  getInstallDirectory() {
    return this._installDir;
  }

  /**
   * When this library is used a default path is used for installing and
   * searched for browsers. This allows multiple projects using this library
   * to share the same browsers, saving space on the users machine.
   * @return {String} The default path for installed browsers.
   */
  getDefaultInstallLocation() {
    let installLocation;
    const homeLocation = process.env.HOME || process.env.USERPROFILE;
    if (homeLocation) {
      installLocation = homeLocation;
    } else {
      installLocation = '.';
    }

    const folderName = process.platform === 'win32' ?
      'selenium-assistant' : '.selenium-assistant';
    return path.join(installLocation, folderName);
  }
}

module.exports = new ApplicationState();
