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

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const seleniumFF = require('selenium-webdriver/firefox');
const LocalBrowser = require('./../src/browser-models/local-browser.js');

require('chai').should();

describe('LocalBrowser', function() {
  const EXAMPLE_CONFIG = {
    _id: 'example',
    _options: {
      selenium: 'example-options',
    },
    _prettyName: 'Example Pretty Name',
  };

  const EXAMPLE_BLACKLIST = {
    999: '1.0.0',
  };

  let sinonStubs = [];
  let releaseNames = {};

  beforeEach(function() {
    releaseNames = {};

    // getPrettyReleaseNames needs to be stubbed since we are instantiating
    // LocalBrowser directly rather than extending it.
    const stub = sinon.stub(LocalBrowser, 'getPrettyReleaseNames', () => {
      return releaseNames;
    });
    sinonStubs.push(stub);
  });

  afterEach(function() {
    sinonStubs.forEach((stub) => {
      stub.restore();
    });
    sinonStubs = [];
  });

  it('should instantiate with valid input', function() {
    new LocalBrowser(
      EXAMPLE_CONFIG,
      'stable',
      EXAMPLE_BLACKLIST
    );
  });

  it('should fail on null for pretty name input', function() {
    expect(() => {
      const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));
      options._prettyName = null;

      new LocalBrowser(
        options,
        'stable',
        EXAMPLE_BLACKLIST
      );
    }).to.throw('Invalid prettyName');
  });

  it('should fail on empty string for pretty name input', function() {
    expect(() => {
      const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));
      options._prettyName = '';

      new LocalBrowser(
        options,
        'stable',
        EXAMPLE_BLACKLIST
      );
    }).to.throw('Invalid prettyName');
  });

  it('should fail on invalid release input', function() {
    expect(() => {
      new LocalBrowser(
        EXAMPLE_CONFIG,
        'notarelease'
      );
    }).to.throw('Unexpected browser release');
  });

  it('should fail on no selenium options', function() {
    expect(() => {
      new LocalBrowser(
        null,
        'stable'
      );
    }).to.throw('No browser config provided.');
  });

  it('should return the pretty name value', function() {
    const prettyName = 'PrettyName' + Date.now();
    const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));
    options._prettyName = prettyName;

    const stableReleaseName = 'Injected Stable Browser Name';
    releaseNames = {
      stable: stableReleaseName,
    };

    const localBrowser = new LocalBrowser(
      options,
      'stable'
    );
    localBrowser.getPrettyName().should.equal(`${prettyName} ${stableReleaseName}`);
  });

  it('should return the release value', function() {
    const stableBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'stable'
    );
    stableBrowser.getReleaseName().should.equal('stable');

    const betaBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'beta'
    );
    betaBrowser.getReleaseName().should.equal('beta');

    const unstableBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'unstable'
    );
    unstableBrowser.getReleaseName().should.equal('unstable');
  });

  it('should return the correct selenium browser ID', function() {
    const localBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'stable'
    );
    localBrowser.getId().should.equal(EXAMPLE_CONFIG._id);
  });

  it('should return the correct selenium options', function() {
    const localBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'stable'
    );
    localBrowser.getSeleniumOptions().should.equal(EXAMPLE_CONFIG._options);
  });

  it('should be able to set the selenium options', function() {
    const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));

    const ffOptions = new seleniumFF.Options();

    const localBrowser = new LocalBrowser(
      options,
      'stable'
    );
    localBrowser.setSeleniumOptions(ffOptions);
    localBrowser.getSeleniumOptions().should.equal(ffOptions);
  });

  it('should throw for non-overriden getExecutablePath()', function() {
    expect(() => {
      const localBrowser = new LocalBrowser(
        EXAMPLE_CONFIG,
        'stable'
      );

      localBrowser.getExecutablePath();
    }).to.throw('overriden');
  });

  it('should throw for non-overriden getRawVersionString()', function() {
    expect(() => {
      const localBrowser = new LocalBrowser(
        EXAMPLE_CONFIG,
        'stable'
      );

      localBrowser.getRawVersionString();
    }).to.throw('overriden');
  });

  it('should throw for non-overriden getVersionNumber()', function() {
    expect(() => {
      const localBrowser = new LocalBrowser(
        EXAMPLE_CONFIG,
        'stable'
      );

      localBrowser.getVersionNumber();
    }).to.throw('overriden');
  });

  it('should throw for isValid when non-overriden method is used', function() {
    expect(() => {
      const localBrowser = new LocalBrowser(
        EXAMPLE_CONFIG,
        'stable'
      );

      localBrowser.isValid();
    }).to.throw('overriden');
  });

  it('should throw when getting a builder when non-overriden method is used', function() {
    expect(() => {
      const localBrowser = new LocalBrowser(
        EXAMPLE_CONFIG,
        'stable'
      );

      localBrowser.getSeleniumDriverBuilder();
    }).to.throw('overriden');
  });

  it('should reject when building a driver which isn\'t a subclass', function() {
    const localBrowser = new LocalBrowser(
      EXAMPLE_CONFIG,
      'stable'
    );

    return localBrowser.getSeleniumDriver()
    .then(() => {
      throw new Error('Unexpected promise resolve');
    }, (err) => {
      (err.message.indexOf('overriden')).should.not.equal(-1);
    });
  });

  it('should handle missing driver module', function() {
    const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));
    options._driverModule = 'exampledriver';

    const ProxiedLocalBrowser = proxyquire('../src/browser-models/local-browser.js', {
      'exampledriver': null,
    });

    const stub = sinon.stub(ProxiedLocalBrowser, 'getPrettyReleaseNames', () => {
      return releaseNames;
    });
    sinonStubs.push(stub);

    const localBrowser = new ProxiedLocalBrowser(
      options,
      'stable'
    );

    return localBrowser.getSeleniumDriver()
    .then(() => {
      throw new Error('Unexpected promise resolve');
    }, (err) => {
      (err.message.indexOf('overriden')).should.not.equal(-1);
    });
  });

  it('should require driver module', function() {
    const options = JSON.parse(JSON.stringify(EXAMPLE_CONFIG));
    options._driverModule = 'exampledriver';

    const ProxiedLocalBrowser = proxyquire('../src/browser-models/local-browser.js', {
      'exampledriver': {
        '@noCallThru': true,
      },
    });

    const stub = sinon.stub(ProxiedLocalBrowser, 'getPrettyReleaseNames', () => {
      return releaseNames;
    });
    sinonStubs.push(stub);

    const localBrowser = new ProxiedLocalBrowser(
      options,
      'stable'
    );

    return localBrowser.getSeleniumDriver()
    .then(() => {
      throw new Error('Unexpected promise resolve');
    }, (err) => {
      (err.message.indexOf('overriden')).should.not.equal(-1);
    });
  });

  // TODO Blacklist test
});
