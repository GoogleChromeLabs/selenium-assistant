/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

/* eslint-env node */

const glob = require('glob');
const path = require('path');
const fs = require('fs');
const firebase = require('firebase');

class ReleaseTracking {
  trackRelease() {
    return new Promise((resolve, reject) => {
      glob(path.join(process.argv[3], '**', '*'), (err, files) => {
        if (err) {
          console.warn(err);
          return reject(err);
        }

        resolve(files);
      });
    })
    .then((files) => {
      return this.trackFiles(files);
    });
  }

  trackFiles(files) {
    return Promise.all(
      files.map((filePath) => {
        return new Promise((resolve, reject) => {
          fs.stat(filePath, (err, stat) => {
            if (err) {
              reject(err);
              return;
            }

            resolve({
              path: filePath,
              size: stat.size,
            });
          });
        });
      })
    )
    .then((fileStats) => {
      const totalSize = fileStats.reduce((cumulative, stats) => {
        return cumulative + stats.size;
      }, 0);

      const data = {
        totalSize: totalSize,
        fileStats: fileStats,
      };

      firebase.initializeApp({
        databaseURL: 'https://release-tracking.firebaseio.com',
      });
      const db = firebase.database();
      const masterListRef = db.ref('/branch/master/');
      const newEntryRef = masterListRef.push();
      newEntryRef.set(data);
    });
  }
}

const releaseTracking = new ReleaseTracking();
releaseTracking.trackRelease()
.then(() => {
  process.exit(0);
})
.catch((err) => {
  console.error('Unable to track release: ', err);
  process.exit(1);
});
