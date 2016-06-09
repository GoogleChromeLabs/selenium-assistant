'use strict';

const del = require('del');
const fs = require('fs');
const path = require('path');

require('chai').should();

describe('DownloadManager', function() {
  const downloadManager = require('../src/download-manager.js');
  const releases = ['stable', 'beta', 'unstable'];
  const browsers = ['firefox', 'chrome', 'opera'];
  const testPath = './test/test-output';

  after(function() {
    return del(testPath);
  });

  beforeEach(function() {
    return del(testPath);
  });

  it('should be able to get default install location', function() {
    const installLocation = downloadManager.getDefaultInstallLocation();

    (typeof installLocation).should.equal('string');
    (installLocation.length).should.be.gt(1);
  });

  browsers.forEach(browser => {
    function validateOutputDirectory() {
      let directoryExists = false;
      try {
        const outputStats = fs.statSync(testPath);
        directoryExists = outputStats.isDirectory();
      } catch (err) {}

      if (!directoryExists) {
        return;
      }

      const downloads = fs.readdirSync(testPath);
      downloads.forEach(downloadFilename => {
        (downloadFilename.indexOf(`${browser}`)).should.not.equal(-1);

        // Add a vague check for file size - in this case > 30MB
        const stats = fs.statSync(path.join(testPath, downloadFilename));
        stats.isDirectory().should.equal(true);
      });
    }

    it(`should be able to download ${browser} without force`, function() {
      // 180 seconds (3minutes)
      this.timeout(180000);

      const promises = [];
      releases.forEach(release => {
        promises.push(
          downloadManager.downloadBrowser(browser, release, {
            installDir: testPath
          })
        );
      });
      return Promise.all(promises)
      .then(() => {
        validateOutputDirectory();
      });
    });

    it(`should be able to download ${browser} with force`, function() {
      // 180 seconds (3minutes)
      this.timeout(180000);

      const promises = [];
      releases.forEach(release => {
        promises.push(
          downloadManager.downloadBrowser(browser, release, {
            installDir: testPath,
            force: true
          })
        );
      });
      return Promise.all(promises)
      .then(() => {
        validateOutputDirectory();
      });
    });
  });
});
