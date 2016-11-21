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

const seleniumFirefox = require('selenium-webdriver/firefox');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Firefox {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'firefox';
    this._options = new seleniumFirefox.Options();
    this._prettyName = 'Firefox';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Nightly',
    };
    this._driverModule = 'geckodriver';
  }
}

module.exports = Firefox;
