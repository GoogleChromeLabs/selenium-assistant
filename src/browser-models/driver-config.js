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
 * @private
 */
class DriverConfig {
  /**
   * @param {String} id The Browser ID. This is what selenium will expect.
   * @param {Object} seleniumOptions This is the Selenium Options object
   * @param {String} prettyName This is the pretty name for the browser.
   * @param {String} driverModuleName This is the name of the driver module
   * if one exists (i.e. 'chromedriver', 'geckodriver', etc).
   */
  constructor(id, seleniumOptions, prettyName, driverModuleName) {
    this._id = id;
    this._options = seleniumOptions;
    this._prettyName = prettyName;
    this._driverModule = driverModuleName;
  }
}

module.exports = DriverConfig;
