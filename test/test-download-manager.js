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

      const promises = [
        downloadManager.downloadBrowser(browser, 'stable', {
          installDir: testPath
        })
      ];

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
