'use strict';

const del = require('del');
const sinon = require('sinon');
const LocalStorage = require('node-localstorage').LocalStorage;
const path = require('path');
const mkdirp = require('mkdirp');

const LocalBrowser = require(
  '../src/browser-models/local-browser.js');
const seleniumAssistant = require('../src/index.js');
const downloadManager = require('../src/download-manager.js');

require('chai').should();

const TIMEOUT = 5 * 60 * 1000;
const RETRIES = 3;

const testPath = './test/test-output';
const localStoragePath = path.join(testPath, 'localstorage');
const stubs = [];
let browserDownloads;

describe('Test Download Manager - Browser Expiration', function() {
  this.timeout(TIMEOUT);
  this.retries(RETRIES);

  const performTest = (browserId, releases) => {
    releases.forEach((release) => {
      it(`should download ${browserId} - ${release} with no expiration.`, function() {
        return downloadManager.downloadLocalBrowser(browserId, release)
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);
          browserDownloads[browserId][release] = false;
          return downloadManager.downloadLocalBrowser(browserId, release);
        })
        .then(() => {
          // The default should be 24 hours, so manipulate the DB to say older
          // than 24 hours
          const localStorage = new LocalStorage(localStoragePath);
          const storageKey = `${browserId}:${release}`;
          const lastUpdate = Date.now() -
            (downloadManager.defaultExpiration * 60 * 60 * 1000);
          localStorage.setItem(storageKey, lastUpdate);
        })
        .then(() => {
          return downloadManager.downloadLocalBrowser(browserId, release, 0);
        })
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);
        });
      });

      it(`should download ${browserId} - ${release} with 0 hour expiration (Force download).`, function() {
        return downloadManager.downloadLocalBrowser(browserId, release, 0)
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);

          browserDownloads[browserId][release] = false;
          return downloadManager.downloadLocalBrowser(browserId, release, 0);
        })
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);
        });
      });

      it(`should download ${browserId} - ${release} with 1 hour expiration and not re-download.`, function() {
        const EXPIRATION_TIME = 1;

        return downloadManager.downloadLocalBrowser(browserId, release,
          EXPIRATION_TIME)
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);

          // Reset download for next step
          browserDownloads[browserId][release] = false;

          return downloadManager.downloadLocalBrowser(browserId, release,
            EXPIRATION_TIME);
        })
        .then(() => {
          browserDownloads[browserId][release].should.equal(false);

          // Alter DB so browser is expired and check it downloads immediately
          const storageKey = `${browserId}:${release}`;
          const localStorage = new LocalStorage(localStoragePath);
          const lastUpdate = Date.now() - (EXPIRATION_TIME * 60 * 60 * 1000);
          localStorage.setItem(storageKey, lastUpdate);
        })
        .then(() => {
          // Reset download for next step
          browserDownloads[browserId][release] = false;

          return downloadManager.downloadLocalBrowser(browserId, release,
              EXPIRATION_TIME);
        })
        .then(() => {
          browserDownloads[browserId][release].should.equal(true);
        });
      });
    });
  };

  before(function() {
    seleniumAssistant.setBrowserInstallDir(testPath);

    const dlChromeStub = sinon.stub(downloadManager, '_downlaodChrome')
      .callsFake((release, installDir) => {
        browserDownloads.chrome[release] = true;
        return Promise.resolve();
      });

    const dlFFStub = sinon.stub(downloadManager, '_downloadFirefox')
      .callsFake((release, installDir) => {
        browserDownloads.firefox[release] = true;
        return Promise.resolve();
      });

    const isValidStub = sinon.stub(LocalBrowser.prototype, 'isValid')
    .callsFake(() => {
      return true;
    });

    stubs.push(dlChromeStub);
    stubs.push(dlFFStub);
    stubs.push(isValidStub);

    return mkdirp(localStoragePath);
  });

  beforeEach(function() {
    browserDownloads = {};
    browserDownloads.chrome = {
      stable: false,
      beta: false,
      unstable: false,
    };
    browserDownloads.firefox = {
      stable: false,
      beta: false,
      unstable: false,
    };
  });

  after(function() {
    this.timeout(6000);

    stubs.forEach((stub) => {
      stub.restore();
    });

    return del(seleniumAssistant.getBrowserInstallDir(), {force: true});
  });

  beforeEach(function() {
    this.timeout(6000);

    // Ensure the test output is clear at the start
    return del(seleniumAssistant.getBrowserInstallDir(), {force: true});
  });

  const browsers = [
    'firefox',
    'chrome',
  ];
  const releases = [
    'stable',
    'beta',
    'unstable',
  ];

  browsers.forEach((browserId) => {
    performTest(browserId, releases);
  });
});
