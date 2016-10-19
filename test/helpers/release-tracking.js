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
  checkRelease() {
    return new Promise((resolve, reject) => {
      glob(path.join(process.argv[3], '**', '*'), (err, files) => {
        if (err) {
          console.warn(err);
          return;
        }

        this.trackFiles(files);
      });
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
      console.log(fileStats);
      const config = {
        databaseURL: 'https://release-tracking.firebaseio.com',
        databaseAuthVariableOverride: {
          uid: process.env.FIREBASE_UID,
        },
      };
      firebase.initializeApp(config);
      const db = firebase.database();
      const ref = db.ref('release-tracking/branch/master/');
      // TODO: Write to firebase.
      console.log(ref);
    });
  }
}

const releaseTracking = new ReleaseTracking();
releaseTracking.checkRelease();
