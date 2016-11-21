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

const webdriver = require('selenium-webdriver');

/**
 * <p>A base class that is designed to be extended to handle browser specific
 * values.</p>
 *
 * <p>An instance of this class helps find and start browsers using selenium.
 * </p>
 *
 * <p>Instances of this class are returned by
 * [automatedBrowserTesting.getDiscoverableBrowsers()]{@link
 * AutomatedBrowserTesting#getDiscoverableBrowsers}</p>
 */
class WebDriverBrowser {
  /**
   * <p>This constructor will throw an error should any of the inputs be
   * invalid / unexpected.</p>
   *
   * @param  {String} prettyName        A user friendly name of the browser
   * @param  {String} release           Release type of browser (can be either
   * 'stable', 'beta' or 'unstable')
   * @param  {String} seleniumBrowserId An id of the browser that will be
   * accepted by selenium (either 'chrome' or 'firefox')
   * @param  {SeleniumOptions} seleniumOptions   This is an instance of either
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  constructor(prettyName, release, seleniumBrowserId, seleniumOptions) {
    if (typeof prettyName !== 'string' || prettyName.length === 0) {
      throw new Error('Invalid prettyName value: ', prettyName);
    }

    if (release !== 'stable' && release !== 'beta' && release !== 'unstable' &&
      release !== 'saucelabs') {
      throw new Error('Unexpected browser release given: ', release);
    }

    if (
      seleniumBrowserId !== 'chrome' &&
      seleniumBrowserId !== 'firefox' &&
      seleniumBrowserId !== 'opera' &&
      seleniumBrowserId !== 'safari' &&
      seleniumBrowserId !== 'MicrosoftEdge' &&
      seleniumBrowserId !== 'internet explorer'
    ) {
      throw new Error('Unexpected browser ID given: ', seleniumBrowserId);
    }

    this._prettyName = prettyName;
    this._release = release;
    this._seleniumBrowserId = seleniumBrowserId;
    this._seleniumOptions = seleniumOptions;
    this._capabilities = null;
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
    const seleniumOptions = this.getSeleniumOptions();

    if (seleniumOptions.setChromeBinaryPath) {
      seleniumOptions.setChromeBinaryPath(this.getExecutablePath());
    } else if (seleniumOptions.setOperaBinaryPath) {
      seleniumOptions.setOperaBinaryPath(this.getExecutablePath());
    } else if (seleniumOptions.setBinary) {
      seleniumOptions.setBinary(this.getExecutablePath());
    } else if (seleniumOptions.setCleanSession) {
      // This is a safari options, there is no way we can define
      // an executable path :(
    } else {
      // throw new Error('Unknown selenium options object');
    }

    // this.addCapability('platform', 'Windows 10');
    // this.addCapability('version', '14.14393');

    let capabilities = this._capabilities;
    if (this.getSeleniumBrowserId() === 'edge') {
      capabilities = seleniumOptions.toCapabilities(this._capabilities);
    }

    const builder = new webdriver
      .Builder()
      .withCapabilities(capabilities)
      .forBrowser(this.getSeleniumBrowserId())
      .setChromeOptions(seleniumOptions)
      .setFirefoxOptions(seleniumOptions)
      .setOperaOptions(seleniumOptions)
      .setSafariOptions(seleniumOptions);

    if (this.getReleaseName() === 'saucelabs') {
      builder.usingServer('https://' + this._capabilities.username + ':' +
        this._capabilities.accessKey + '@ondemand.saucelabs.com:443/wd/hub');
    }

    return builder;
  }
}

module.exports = WebDriverBrowser;
