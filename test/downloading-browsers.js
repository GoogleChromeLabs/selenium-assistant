'use strict';

const del = require('del');
const seleniumAssistant = require('../src/index.js');

const TIMEOUT = 5 * 60 * 1000;
const RETRIES = 3;

describe('Test Download Manager - Browser Download', function() {
  this.timeout(TIMEOUT);
  this.retries(RETRIES);

  before(function() {
    // Reset Install Directory
    seleniumAssistant.setBrowserInstallDir(null);

    return del(seleniumAssistant.getBrowserInstallDir(), {force: true});
  });

  const setupDownloadTest = (browserId, release) => {
    it(`should download ${browserId} - ${release} from the network`, function() {
      this.timeout(5 * 60 * 1000);
      return seleniumAssistant.downloadLocalBrowser(browserId, release, 0);
    });
  };

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
    releases.forEach((release) => {
      setupDownloadTest(browserId, release);
    });
  });
});
