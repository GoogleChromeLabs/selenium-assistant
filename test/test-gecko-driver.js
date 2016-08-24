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

const del = require('del');
const which = require('which');

const expect = require('chai').expect;

const testPath = './test/test-output';

describe('Test GeckoDriver', function() {
  before(function() {
    this.timeout(180000);
    const seleniumAssistant = require('../src/index.js');
    seleniumAssistant.setBrowserInstallDir(testPath);

    // Ensure the test output is clear at the start
    return del(seleniumAssistant.getBrowserInstallDir(), {force: true});
  });

  after(function() {
    this.timeout(6000);
    const seleniumAssistant = require('../src/index.js');
    return del(seleniumAssistant.getBrowserInstallDir(), {force: true});
  });

  it('should be able to download driver and get geckodriver on path', function() {
    this.timeout(10000);

    const seleniumAssistant = require('../src/index.js');
    return seleniumAssistant.downloadFirefoxDriver()
    .then(() => {
      expect(() => {
        which.sync('geckodriver');
      }).to.not.throw();
    });
  });

  it('should be able to get geckdriver from previous test', function() {
    expect(() => {
      which.sync('geckodriver');
    }).to.not.throw();
  });
});
