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

// const fs = require('fs');
// const path = require('path');
// const which = require('which');
const seleniumIE = require('selenium-webdriver/ie');
const WebDriverBrowser = require('./web-driver-browser');
// const application = require('../application-state.js');

/**
 * <p>Handles the prettyName and executable path for Chrome browser.</p>
 *
 * @private
 * @extends WebDriverBrowser
 */
class IEWebDriverBrowser extends WebDriverBrowser {
  /**
   * Create a Chrome representation of a {@link WebDriverBrowser}
   * instance on a specific channel.
   * @param {string} release The release name for this browser instance.
   */
  constructor(release) {
    let prettyName = 'Internet Explorer';

    if (release === 'stable') {
      prettyName += ' Stable';
    }

    super(
      prettyName,
      release,
      'internet explorer',
      new seleniumIE.Options()
    );
  }

  /**
   * Get the available releases for this browser.
   * @return {Array<string>} Array of releases supported.
   */
  static getAvailableReleases() {
    return ['stable'];
  }
}

module.exports = IEWebDriverBrowser;
