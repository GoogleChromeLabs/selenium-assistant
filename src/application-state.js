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
const sauceConnectLauncher = require('sauce-connect-launcher');

/**
 * This class is a super basic class that stores shared state across the
 * classes in this library / module.
 *
 * @private
 */
class ApplicationState {
  /**
   * This constructor is never used directly, but this class stores the
   * overall current state of selenium-assistant while in use.
   */
  constructor() {
    this._installDir = this.getDefaultInstallLocation();
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

  /**
   * Before attempting to use a Sauce Labs browser, you must
   * call this method with your Sauce Labs Username and Access Key.
   * @param {String} username Your Sauce Labs username.
   * @param {String} accessKey Your Sauce Labs accessKey.
   */
  setSaucelabsDetails(username, accessKey) {
    this._saucelabs = this._saucelabs || {};
    this._saucelabs.username = username;
    this._saucelabs.accessKey = accessKey;
  }

  /**
   * @return {Object} Returns an object containing the username and accessKey
   * for saucelabs.
   */
  getSaucelabsDetails() {
    if (!this._saucelabs) {
      throw new Error('Saucelab details not defined.');
    }

    return this._saucelabs;
  }

  /**
   * @return {Promise} Returns a promise that resolves once the connection is
   * open.
   */
  startSaucelabsConnect() {
    if (this._sauceConnect) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const options = {
        username: this._saucelabs.username,
        accessKey: this._saucelabs.accessKey,
        // Using tunnelIdentifier means all Sauce Labs browsers must define
        // this capability
        // tunnelIdentifier:
        //  // Slashes in the identifier breaks a pidfile requirement
        //  `selenium-assistant_sauce-connect-tunnel_${Date.now()}`,
        connectRetries: 3,
      };

      sauceConnectLauncher(options, (err, sauceConnectProcess) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(sauceConnectProcess);
      });
    })
        .then((sauceConnectProcess) => {
          this._sauceConnect = sauceConnectProcess;
        });
  }

  /**
   * @return {Promise} A promise that resolves once the connection is closed.
   */
  stopSaucelabsConnect() {
    if (!this._sauceConnect) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this._sauceConnect.close(resolve);
    })
        .then(() => {
          this._sauceConnect = null;
        });
  }
}

module.exports = new ApplicationState();
