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

const LocalChromeBrowser = require('./local-browsers/chrome');
const LocalFirefoxBrowser = require('./local-browsers/firefox');
const LocalOperaBrowser = require('./local-browsers/opera');
const LocalSafariBrowser = require('./local-browsers/safari');

/**
 * This class is a simple helper to define the possible permutations of
 * browsers and create the objects which are returned by
 * {@link SeleniumAssistant}.
 *
 * @private
 */
class BrowserManager {

  // Details from:
  // https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options#TestConfigurationOptions-BrowserVersion
  /**
   * This method will return a browser instance tied to a saucelabs hosted
   * browser.
   *
   * @param {String} browserId The browser ID you wish to control.
   * @param {String} browserVersion The browser verions you wish to target.
   * This is the saucelabs version, not release name. Can be "latest",
   * "latest-1", "latest-2", "45.0"
   * @param {Object} options Add additional options for the saucelabs browser.
   * @return {WebDriverBrowser} browser A WebDriverBrowser instance pointing
   * to a Saucelabs hosted browser.
   */
  getSaucelabsBrowser(browserId, browserVersion, options) {
    /** const browser = this.createWebDriverBrowser(browserId, 'saucelabs');
    // browser.addCapability('version', browserVersion);
    browser.addCapability('username', options.saucelabs.username);
    browser.addCapability('accessKey', options.saucelabs.accessKey);

    // This is the name that is shown on saucelabs.
    if (options.name) {
      browser.addCapability('name', options.name);
    }

    if (browserId === 'safari') {
      // Set default platform to windows 10 otherwise it will fail.
      browser.addCapability('platform', 'Windows 10');
    }

    return browser;**/
  }

  /**
   * <p>This method returns the full list of browsers this library supports,
   * regardless of whether the current environment has access to them or not.
   * </p>
   *
   * <p>As more browsers are specifically added, this list will grow.</p>
   *
   * @return {Array<WebDriverBrowser>} An array of all the possible browsers
   *                                   this library supports.
   */
  getSupportedBrowsers() {
    return [
      this.getLocalBrowser('chrome', 'stable'),
      this.getLocalBrowser('chrome', 'beta'),
      this.getLocalBrowser('chrome', 'unstable'),

      this.getLocalBrowser('firefox', 'stable'),
      this.getLocalBrowser('firefox', 'beta'),
      this.getLocalBrowser('firefox', 'unstable'),

      this.getLocalBrowser('opera', 'stable'),
      this.getLocalBrowser('opera', 'beta'),
      this.getLocalBrowser('opera', 'unstable'),

      this.getLocalBrowser('safari', 'stable'),
      this.getLocalBrowser('safari', 'beta'),
    ];
  }

  /**
   * <p>A very simple method to create a {@link WebDriverBrowser} instance
   * with the current config based on minimal config.</p>
   *
   * <p>This method will throw if you request a browser that this
   * library doesn't support.</p>
   *
   * @param  {String} browserId The selenium browser Id 'chrome', 'firefox', etc
   * @param  {String} release   The release you want the browser to be on
   *                            'stable', 'beta', 'unstable' or 'saucelabs'
   * @return {WebDriverBrowser} An instance of the browser you requested.
   */
  getLocalBrowser(browserId, release) {
    if (release !== 'stable' &&
      release !== 'beta' &&
      release !== 'unstable') {
      throw new Error('Unknown release type.');
    }

    switch (browserId) {
      case 'chrome':
        return new LocalChromeBrowser(release);
      case 'firefox':
        return new LocalFirefoxBrowser(release);
      case 'opera':
        return new LocalOperaBrowser(release);
      case 'safari':
        return new LocalSafariBrowser(release);
      default:
        throw new Error('Unknown web driver browser request: ', browserId);
    }
  }
}

module.exports = new BrowserManager();
