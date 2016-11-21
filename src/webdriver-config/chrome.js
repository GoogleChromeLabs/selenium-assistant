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

const seleniumChrome = require('selenium-webdriver/chrome');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Chrome {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'chrome';
    this._options = new seleniumChrome.Options();
    this._prettyName = 'Google Chrome';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Dev',
    };
    this._driverModule = 'chromedriver';
  }
}

module.exports = Chrome;
