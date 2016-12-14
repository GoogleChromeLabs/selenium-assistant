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

/**
 * A base class for all other browser models to extend.
 */
class Browser {
  /**
   * @param {Object} config The required config for the browser
   * this instance should represent.
   */
  constructor(config) {
    if (typeof config === 'undefined' || config === null ||
      typeof config !== 'object') {
      throw new Error('No browser config provided.');
    }

    this._config = config;
  }

  /**
   * This is a simple method to define capabilities that'll be
   * passed to the WebDriver builder when you call getSeleniumDriverBuilder()
   * or getSeleniumDriver().
   *
   * @param {String} key The capability key.
   * @param {String} value The Value of the capability.
   */
  addCapability(key, value) {
    if (!this._capabilities) {
      this._capabilities = {};
    }

    this._capabilities[key] = value;
  }

  /**
   * Get the ID of the browser.
   * @return {String} ID of this browser.
   */
  getId() {
    return this._config._id;
  }

  /**
   * @return {String} Gets the name of the driver module to use with this
   * browser. Null if there is no driver module
   */
  getDriverModule() {
    return this._config._driverModule;
  }

  /**
   * A user friendly name for the browser
   * @return {String} A user friendly name for the browser
   */
  getPrettyName() {
    return this._config._prettyName;
  }

  /**
   * The selenium options passed to webdriver's `Builder` method. This
   * will have the executable path set for the browser so you should
   * manipulate these options rather than create entirely new objects.
   *
   * @return {SeleniumOptions} An instance of either
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  getSeleniumOptions() {
    return this._config._options;
  }

  /**
   * If changes are made to the selenium options, call this method to
   * set them before calling {@link getSeleniumDriver}.
   * @param {SeleniumOptions} options An instance of
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  setSeleniumOptions(options) {
    this._config._options = options;
  }
}

module.exports = Browser;
