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

const Browser = require('./browser.js');
const applicationState = require('../application-state');
const webdriver = require('selenium-webdriver');

// To find out the configuration you can use see:
// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/

/**
 * The SauceLabsBrowser class is an abstract class that is overriden by browser
 * classes that are supported on Sauce Labs (Chrome, Edge, Firefox, IE,
 * and Safari).
 * @extends Browser
 */
class SauceLabsBrowser extends Browser {
  /**
   * Constructs new Sauce Labs Browser.
   * @param {DriverConfig} config The config for the browser.
   * @param {String} version Version name to be given to Sauce Labs.
   */
  constructor(config, version) {
    super(config);

    if (typeof config._prettyName !== 'string' ||
      config._prettyName.length === 0) {
      throw new Error('Invalid prettyName value: ', config._prettyName);
    }

    this._prettyName = `${config._prettyName} - [${version}]`;
    this._version = version;
  }

  /**
   * A user friendly name for the browser. This is largely useful for
   * console logging. SauceLabsBrowsers will also include the version passed
   * into the constructor.
   * @return {String} A user friendly name for the browser.
   */
  getPrettyName() {
    return this._prettyName;
  }

  /**
   * This method resolves to a raw WebDriver instance.
   *
   * @return {Promise<WebDriver>} A WebDriver Instance, see [selenium-webdriver.ThenableWebDriver]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html} for more info.
   */
  getSeleniumDriver() {
    if (this.getDriverModule()) {
      try {
        // This will require the necessary driver module that will add the
        // driver executable to the current path.
        require(this.getDriverModule());
      } catch (err) {
        // NOOP
      }
    }

    try {
      const builder = this.getSeleniumDriverBuilder();
      const buildResult = builder.build();
      if (buildResult.then) {
        return buildResult;
      }
      return Promise.resolve(buildResult);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * This is the version passed into the constructor which is ultimately used
   * by Sauce Labs (i.e. 'latest', 'latest-2', '48').
   *
   * @return {String} The Sauce Labs browser version.
   */
  getVersion() {
    return this._version;
  }

  /**
   * This method returns the preconfigured WebDriver Builder.
   *
   * This is useful if you wish to customise the builder with additional
   * options (i.e. customise the proxy of the driver.)
   *
   * @return {WebDriverBuilder} A WebDriver Builder instance, see [selenium-webdriver.Builder]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html} for more info.
   */
  getSeleniumDriverBuilder() {
    const saucelabsDetails = applicationState.getSaucelabsDetails();
    this.addCapability('username', saucelabsDetails.username);
    this.addCapability('accessKey', saucelabsDetails.accessKey);

    const builder = new webdriver
        .Builder();

    return builder.usingServer('https://' + saucelabsDetails.username + ':' +
      saucelabsDetails.accessKey + '@ondemand.saucelabs.com:443/wd/hub');
  }
}

module.exports = SauceLabsBrowser;
