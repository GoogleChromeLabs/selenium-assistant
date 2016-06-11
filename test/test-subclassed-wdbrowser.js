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

const fs = require('fs');
const sinon = require('sinon');
const seleniumChrome = require('selenium-webdriver/chrome');
const seleniumFirefox = require('selenium-webdriver/firefox');
const seleniumOpera = require('selenium-webdriver/opera');

const releases = ['stable', 'beta', 'unstable'];
const sinonStubs = [];

function performTest(name, wdBrowserPath, prettyNameStart, seleniumBrowser) {
  const DriverBrowser = require(wdBrowserPath);

  describe(name, function() {
    afterEach(function() {
      while (sinonStubs.length > 0) {
        const stub = sinonStubs.pop();
        stub.restore();
      }
    });

    it('should be able to build new DriverBrowser', function() {
      releases.forEach(release => {
        new DriverBrowser(release);
      });
    });

    it('should have a valid pretty name', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        browser.getPrettyName().indexOf(prettyNameStart).should.equal(0);
      });
    });

    it('should have the correct Options object', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        (browser.getSeleniumOptions() instanceof seleniumBrowser.Options).should.equal(true);
      });
    });

    it('should be able to get an executable path', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        const executablePath = browser.getExecutablePath();
        if (executablePath) {
          (typeof executablePath).should.equal('string');
        } else {
          (executablePath === null).should.equal(true);
        }
      });
    });

    it('should be able to get raw version output', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        const rawString = browser.getRawVersionString();
        if (rawString) {
          (typeof rawString).should.equal('string');
        } else {
          (rawString === null).should.equal(true);
        }
      });
    });

    it('should be able to get a version number', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        const versionNumber = browser.getVersionNumber();
        if (versionNumber) {
          (typeof versionNumber).should.equal('number');
        } else {
          versionNumber.should.equal(false);
        }
      });
    });

    it('should get null for raw version output if no executable found', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        sinonStubs.push(
          sinon.stub(browser, 'getExecutablePath', () => {
            return null;
          })
        );

        const rawString = browser.getRawVersionString();
        (rawString === null).should.equal(true);
      });
    });

    it('should get false for version number if no executable found', function() {
      releases.forEach(release => {
        const browser = new DriverBrowser(release);
        sinonStubs.push(
          sinon.stub(browser, 'getExecutablePath', () => {
            return null;
          })
        );

        const versionNumber = browser.getVersionNumber();
        versionNumber.should.equal(false);
      });
    });
  });
}

const webdriverFiles = fs.readdirSync('./src/webdriver-browser');
webdriverFiles.forEach(webdriverFile => {
  if (webdriverFile === 'web-driver-browser.js') {
    return;
  }

  let seleniumBrowser;
  let prettyNameStart;
  switch (webdriverFile) {
    case 'chrome.js':
      prettyNameStart = 'Google Chrome ';
      seleniumBrowser = seleniumChrome;
      break;
    case 'firefox.js':
      prettyNameStart = 'Firefox ';
      seleniumBrowser = seleniumFirefox;
      break;
    case 'opera.js':
      prettyNameStart = 'Opera ';
      seleniumBrowser = seleniumOpera;
      break;
    default:
      throw new Error('Unable to find options for: ', webdriverFile);
  }

  performTest(
    `WebDriverBrowser/${webdriverFile}`,
    `./../src/webdriver-browser/${webdriverFile}`,
    prettyNameStart,
    seleniumBrowser
  );
});
