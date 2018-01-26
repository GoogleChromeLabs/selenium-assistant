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

const seleniumWebdriver = require('selenium-webdriver');

/**
 * A base class which all "types" of browser models extend.
 *
 * For example: {@link LocalBrowser|LocalBrowser} and
 * {@link SauceLabsBrowser|SauceLabsBrowser}
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
    this._capabilities = new seleniumWebdriver.Capabilities();

    this.addCapability(seleniumWebdriver.Capability.BROWSER_NAME, this.getId());
  }

  /**
   * You can define capabilities here that will  be
   * given to the WebDriver builder when
   * [getSeleniumDriverBuilder()]{@link Browser#getSeleniumDriverBuilder} or
   * [getSeleniumDriver()]{@link Browser#getSeleniumDriver} is called.
   *
   * @param {String} key The capability key.
   * @param {String} value The capability value.
   */
  addCapability(key, value) {
    this._capabilities.set(key, value);
  }

  /**
   * Get the Selenium ID of the browser (i.e. 'chrome', 'firefox',
   * 'microsoftedge' etc.).
   * @return {String} Selenium ID of this browser.
   */
  getId() {
    return this._config._id;
  }

  /**
   * Some browsers require an executable be available on the current path
   * to work with Selenium. If this is the case, there may be an NPM module
   * that can download and add the executable to the path. This method returns
   * the name of the appropriate NPM module for this browser.
   *
   * For example, Chrome uses the 'chromedriver' npm module and Firefox uses
   * the 'geckodriver' module.
   *
   * @return {String|null} The name of the NPM driver module to use with this
   * browser. Null is returned if there is no driver module.
   */
  getDriverModule() {
    return this._config._driverModule;
  }

  /**
   * This is simple a user friendly name for the browser. This is largely
   * used for printing friendly debug info in tests.
   * @return {String} A user friendly name for the browser
   */
  getPrettyName() {
    return this._config._prettyName;
  }

  /**
   * The selenium options passed to WebDriver's Builder.
   *
   * For Chrome, this will return an instance of `selenium-webdriver/chrome`,
   * for Firefox it would return an instance of `selenium-webdriver/firefox`.
   *
   * @return {SeleniumOptions} An instance of the appropriate
   * `selenium-webdriver` options for this browser.
   */
  getSeleniumOptions() {
    return this._config._options;
  }

  /**
   * If changes are made to the selenium options, call this method to
   * set them before calling
   * [getSeleniumDriver()]{@link Browser#getSeleniumDriver}.
   *
   * @param {SeleniumOptions} options An instance of a `selenium-webdriver`
   * options class.
   */
  setSeleniumOptions(options) {
    this._config._options = options;
  }

  /* eslint-disable valid-jsdoc */
  /**
   * This method returns the preconfigured WebDriver Builder.
   *
   * This is useful if you wish to customise the builder with additional
   * options (i.e. customise the proxy of the driver.)
   * @return {WebDriverBuilder} A WebDriver Builder instance, see [selenium-webdriver.Builder]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html} for more info.
   */
  getSeleniumDriverBuilder() {
    throw new Error('getSeleniumDriverBuilder() must be overriden by ' +
      'subclasses');
  }

  /**
   * This method resolves to a raw WebDriver instance.
   *
   * @return {Promise<WebDriver>} A WebDriver Instance, see [selenium-webdriver.ThenableWebDriver]{@link http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html} for more info.
   */
  getSeleniumDriver() {
    throw new Error('getSeleniumDriver() must be overriden by ' +
      'subclasses');
  }
  /* eslint-enable valid-jsdoc */
}

module.exports = Browser;
