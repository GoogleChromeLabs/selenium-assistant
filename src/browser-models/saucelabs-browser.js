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
const Browser = require('./browser.js');
const applicationState = require('../application-state');
const webdriver = require('selenium-webdriver');

// To find out the configuration you can use see:
// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/

/**
 * Local browser is an abstract class with some implemented methods
 * and some methods that MUST be overriden.
 */
class LocalBrowser extends Browser {
  /**
   * Constructs new local browser.
   * @param {Object} config TODO This should be a shared webdriver config
   * class.
   * @param {string} version Version name to be given to Saucelabs.
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
   * A user friendly name for the browser
   * @return {String} A user friendly name for the browser
   */
  getPrettyName() {
    return this._prettyName;
  }

  /**
   * <p>This method resolves to a webdriver instance of this browser i
   * nstance.</p>
   *
   * <p>For more info, see:
   * {@link http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebDriver.html | WebDriver Docs}</p>
   *
   * @return {Promise<WebDriver>} [description]
   */
  getSeleniumDriver() {
    if (this.getDriverModule()) {
      try {
        // This will require the necessary driver module that will add the
        // driver executable to the current path.
        const driverModule = require(this.getDriverModule());
        // The operadriver module DOESNT add the driver to the current path.
        if (this.getId() === 'opera') {
          // Operadriver.path includes the executable name which upsets
          // selenium and finding the operadriver executable.
          process.env.PATH += path.delimiter + path.dirname(driverModule.path);
        }
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
   * <p>The release name for this browser, either 'stable', 'beta',
   * 'unstable'.</p>
   *
   * <p>Useful if you only want to test <i>or</i> not test on a particular
   * release type.</p>
   * @return {String} Release name of browser. 'stable', 'beta' or 'unstable'
   */
  getVersion() {
    return this._version;
  }

  /**
   * <p>This method returns the preconfigured builder used by
   * getSeleniumDriver().</p>
   *
   * <p>This is useful if you wish to customise the builder with additional
   * options (i.e. customise the proxy of the driver.)</p>
   *
   * <p>For more info, see:
   * {@link https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_Builder.html | WebDriverBuilder Docs}</p>
   *
   * @return {WebDriverBuilder} Builder that resolves to a webdriver instance.
   */
  getSeleniumDriverBuilder() {
    const saucelabsDetails = applicationState.getSaucelabsDetails();
    this.addCapability('username', saucelabsDetails.username);
    this.addCapability('accessKey', saucelabsDetails.accessKey);

    const builder = new webdriver
      .Builder();

    builder.usingServer('https://' + saucelabsDetails.username + ':' +
      saucelabsDetails.accessKey + '@ondemand.saucelabs.com:443/wd/hub');

    return builder;
  }
}

module.exports = LocalBrowser;
