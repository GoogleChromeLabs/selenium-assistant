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

require('chai').should();

describe('Application State', function() {
  it('should be able to get default install location', function() {
    const applicationState = require('../src/application-state.js');
    const installLocation = applicationState.getDefaultInstallLocation();

    (typeof installLocation).should.equal('string');
    (installLocation.length).should.be.gt(1);
  });

  it('should return the current directory if no useful environment variables exist', function() {
    const originalHomeValue = process.env.HOME;
    const originalUserProfValue = process.env.USERPROFILE;

    delete process.env.HOME;
    delete process.env.USERPROFILE;

    const applicationState = require('../src/application-state.js');
    const installLocation = applicationState.getDefaultInstallLocation();

    process.env.HOME = originalHomeValue;
    process.env.USERPROFILE = originalUserProfValue;

    (typeof installLocation).should.equal('string');
    (installLocation).should.equal('.selenium-assistant');
  });

  it('should start with default install directory', function() {
    const applicationState = require('../src/application-state.js');
    applicationState.getInstallDirectory().should.equal(
      applicationState.getDefaultInstallLocation()
    );
  });

  it('should be able to get a change install directory', function() {
    const applicationState = require('../src/application-state.js');
    const newPath = './test/test-output/';
    applicationState.setInstallDirectory(newPath);
    applicationState.getInstallDirectory().should.equal(path.resolve(newPath));
  });

  it('should be able to pass in null to reset state to default install location', function() {
    const applicationState = require('../src/application-state.js');

    const newPath = './test/test-output/';
    applicationState.setInstallDirectory(newPath);
    applicationState.getInstallDirectory().should.equal(path.resolve(newPath));

    applicationState.setInstallDirectory(null);
    applicationState.getInstallDirectory().should.equal(
      applicationState.getDefaultInstallLocation()
    );
  });
});
