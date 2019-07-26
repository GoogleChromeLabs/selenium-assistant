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

const SauceLabsBrowser = require('../browser-models/saucelabs-browser');
const EdgeConfig = require('../webdriver-config/edge');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * <p>Note that Edge gets cranky about which ports are used for localhost +
 * saucelabs.</p>
 *
 * <p>https://support.saucelabs.com/customer/portal/questions/14368823-requests-to-localhost-on-microsoft-edge-are-failing-over-sauce-connect</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class EdgeWebDriverBrowser extends SauceLabsBrowser {
  /**
   * Create a Chrome representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param {String} version The version name for this browser instance.
   */
  constructor(version) {
    super(new EdgeConfig(), version);

    // Set default platform to windows 10 otherwise it will fail.
    this.addCapability('platform', 'Windows 10');
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
    let builder = super.getSeleniumDriverBuilder();
    const seleniumOptions = this.getSeleniumOptions();
    const capabilities = seleniumOptions.toCapabilities(this._capabilities);

    builder = builder
        .withCapabilities(capabilities);

    return builder;
  }
}

module.exports = EdgeWebDriverBrowser;
