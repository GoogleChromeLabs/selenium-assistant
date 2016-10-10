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
const seleniumChrome = require('selenium-webdriver/chrome');
const seleniumFF = require('selenium-webdriver/firefox');
const seleniumOpera = require('selenium-webdriver/opera');

require('chai').should();

describe('WebDriverBrowser', function() {
  const WebDriverBrowser = require('./../src/webdriver-browser/web-driver-browser.js');

  it('should instantiate with valid input', function() {
    new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );
  });

  it('should fail on null for pretty name input', function() {
    expect(() => {
      new WebDriverBrowser(
        null,
        'notarelease',
        'chrome',
        new seleniumChrome.Options()
      );
    }).to.throw('Invalid prettyName');
  });

  it('should fail on empty string for pretty name input', function() {
    expect(() => {
      new WebDriverBrowser(
        '',
        'notarelease',
        'chrome',
        new seleniumChrome.Options()
      );
    }).to.throw('Invalid prettyName');
  });

  it('should fail on invalid release input', function() {
    expect(() => {
      new WebDriverBrowser(
        'Pretty Name',
        'notarelease',
        'chrome',
        new seleniumChrome.Options()
      );
    }).to.throw('Unexpected browser release');
  });

  it('should fail on selenium browser id release input', function() {
    expect(() => {
      new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'notabrowser',
        new seleniumChrome.Options()
      );
    }).to.throw('Unexpected browser ID');
  });

  it('should return the pretty name value', function() {
    const prettyName = 'PrettyName' + Date.now();
    const webdriver = new WebDriverBrowser(
      prettyName,
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );
    webdriver.getPrettyName().should.equal(prettyName);
  });

  it('should return the release value', function() {
    const stableWebdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );
    stableWebdriver.getReleaseName().should.equal('stable');

    const betaWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'beta',
      'chrome',
      new seleniumChrome.Options()
    );
    betaWebDriver.getReleaseName().should.equal('beta');

    const unstableWebdriver = new WebDriverBrowser(
      'Pretty Name',
      'unstable',
      'chrome',
      new seleniumChrome.Options()
    );
    unstableWebdriver.getReleaseName().should.equal('unstable');
  });

  it('should return the correct selenium browser ID', function() {
    const chromeWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );
    chromeWebDriver.getSeleniumBrowserId().should.equal('chrome');

    const ffWebdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'firefox',
      new seleniumChrome.Options()
    );
    ffWebdriver.getSeleniumBrowserId().should.equal('firefox');

    const operaWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'opera',
      new seleniumChrome.Options()
    );
    operaWebDriver.getSeleniumBrowserId().should.equal('opera');
  });

  it('should return the correct selenium options', function() {
    const chromeOptions = new seleniumChrome.Options();
    const ffOptions = new seleniumFF.Options();
    const operaOptions = new seleniumOpera.Options();

    const chromeWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      chromeOptions
    );
    chromeWebDriver.getSeleniumOptions().should.equal(chromeOptions);

    const ffWebdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'firefox',
      ffOptions
    );
    ffWebdriver.getSeleniumOptions().should.equal(ffOptions);

    const operaWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'opera',
      operaOptions
    );
    operaWebDriver.getSeleniumOptions().should.equal(operaOptions);
  });

  it('should be able to set the selenium options', function() {
    const chromeOptions = new seleniumChrome.Options();
    const ffOptions = new seleniumFF.Options();
    const operaOptions = new seleniumOpera.Options();

    const chromeWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );
    chromeWebDriver.setSeleniumOptions(chromeOptions);
    chromeWebDriver.getSeleniumOptions().should.equal(chromeOptions);

    const ffWebdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'firefox',
      new seleniumFF.Options()
    );
    ffWebdriver.setSeleniumOptions(ffOptions);
    ffWebdriver.getSeleniumOptions().should.equal(ffOptions);

    const operaWebDriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'opera',
      new seleniumOpera.Options()
    );
    operaWebDriver.setSeleniumOptions(operaOptions);
    operaWebDriver.getSeleniumOptions().should.equal(operaOptions);
  });

  it('should throw for non-overriden getExecutablePath()', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        new seleniumChrome.Options()
      );

      webdriver.getExecutablePath();
    }).to.throw('overriden');
  });

  it('should throw for non-overriden getRawVersionString()', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        new seleniumChrome.Options()
      );

      webdriver.getRawVersionString();
    }).to.throw('overriden');
  });

  it('should throw for non-overriden getVersionNumber()', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        new seleniumChrome.Options()
      );

      webdriver.getVersionNumber();
    }).to.throw('overriden');
  });

  it('should throw for isValid when non-overriden method is used', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        new seleniumChrome.Options()
      );

      webdriver.isValid();
    }).to.throw('overriden');
  });

  it('should throw for when invalid options object is used to get builder', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        {}
      );

      webdriver.getSeleniumDriverBuilder();
    }).to.throw('Unknown selenium options');
  });

  it('should throw when getting a builder when non-overriden method is used', function() {
    expect(() => {
      const webdriver = new WebDriverBrowser(
        'Pretty Name',
        'stable',
        'chrome',
        new seleniumChrome.Options()
      );

      webdriver.getSeleniumDriverBuilder();
    }).to.throw('overriden');
  });

  it('should reject when invalid options object is used to get driver', function() {
    const webdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      {}
    );

    return webdriver.getSeleniumDriver()
    .then(() => {
      throw new Error('Unexpected promise resolve');
    }, err => {
      (err.message.indexOf('Unknown selenium options')).should.not.equal(-1);
    });
  });

  it('should reject when building a driver which isn\'t a subclass', function() {
    const webdriver = new WebDriverBrowser(
      'Pretty Name',
      'stable',
      'chrome',
      new seleniumChrome.Options()
    );

    return webdriver.getSeleniumDriver()
    .then(() => {
      throw new Error('Unexpected promise resolve');
    }, err => {
      (err.message.indexOf('overriden')).should.not.equal(-1);
    });
  });
});
