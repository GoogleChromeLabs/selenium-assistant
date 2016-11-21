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

const seleniumEdge = require('selenium-webdriver/edge');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Edge {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'microsoftedge';
    this._options = new seleniumEdge.Options();
    this._prettyName = 'Microsoft Edge';
    this._prettyReleaseNames = {
      stable: 'Stable',
    };
  }
}

module.exports = Edge;
