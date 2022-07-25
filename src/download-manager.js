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

const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const request = require('request');
const mkdirp = require('mkdirp');
const dmg = require('dmg');
const fse = require('fs-extra');
const LocalStorage = require('node-localstorage').LocalStorage;

const application = require('./application-state.js');
const browserManager = require('./browser-manager.js');

/**
 * The download manager's sole job is to download browsers and drivers.
 * The executable paths for these downloaded browsers will be discovered
 * by the individual {@link WebDriverBrowser} instances.
 *
 * @private
 */
class DownloadManager {
  /**
   * Get the default expiration for downloaded browsers.
   * @return {number} Returns the default expiration of 24 hours.
   */
  get defaultExpiration() {
    return 24;
  }

  /**
   * This method will download a browser if it is needed (i.e. can't be found
   * in the usual system location or in the install directory).
   * @param  {String} browserId This is the Selenium ID of the browser you wish
   *                            to download ('chrome', 'firefox').
   * @param  {String} release   This downloads the browser on a particular track
   *                            and can be 'stable', 'beta' or 'unstable'
   * @param  {Number} [expirationInHours=24] This is how long until a browser
   *                             download is regarded and expired and Should
   *                             be updated. A value of 0 will force a download.
   *                             If you want to install the browser regardless
   *                             of any existing installs of the process, pass
   *                             in true.
   * @return {Promise}           Promise resolves once the browser has been
   *                             downloaded and ready for use.
   */
  downloadLocalBrowser(browserId, release, expirationInHours) {
    const installDir = application.getInstallDirectory();
    const storageKey = `${browserId}:${release}`;
    const localstoragePath =
      path.join(application.getInstallDirectory(), 'localstorage');
    let localStorage = null;

    return new Promise((resolve, reject) => {
      // TODO: Switch to fs-extra
      mkdirp(localstoragePath, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
        .then(() => {
          localStorage = new LocalStorage(localstoragePath);
          const lastBrowserUpdate = localStorage.getItem(storageKey);
          if (lastBrowserUpdate) {
            if (typeof expirationInHours === 'undefined') {
              expirationInHours = this.defaultExpiration;
            }

            const expirationInMillis = expirationInHours * 60 * 60 * 1000;
            const dateComparison = Date.now() - expirationInMillis;

            if (parseInt(lastBrowserUpdate, 10) > dateComparison) {
              const browserInstance = browserManager
                  .getLocalBrowser(browserId, release);
              return !browserInstance.isValid();
            }
          }

          return true;
        })
        .catch((err) => {
          // In case of error download browser.
          return true;
        })
        .then((browserNeedsDownloading) => {
          if (!browserNeedsDownloading) {
            return;
          }

          let downloadPromise;
          switch (browserId) {
            case 'chrome':
              downloadPromise = this._downloadChrome(release, installDir);
              break;
            case 'firefox':
              downloadPromise = this._downloadFirefox(release, installDir);
              break;
            default:
              throw new Error(`Apologies, but ${browserId} can't be ` +
                `downloaded with this tool`);
          }

          return downloadPromise.then(() => {
            if (localStorage) {
              return localStorage.setItem(storageKey, Date.now());
            }
          });
        });
  }

  /**
   * Download a version of Chrome to a specific directory.
   * @param {String} release This should be 'stable' or 'beta'.
   * @param {String} installDir The path to install Chrome into.
   * @return {Promise} Promise that resolves once the download has completed.
   */
  _downloadChrome(release, installDir) {
    let downloadUrl;
    let fileExtension = null;
    let chromeProduct = null;
    let chromeOSXAppName = null;

    switch (release) {
      case 'stable':
        chromeProduct = 'google-chrome-stable';
        break;
      case 'beta':
        chromeProduct = 'google-chrome-beta';
        break;
      default:
        throw new Error(`Unknown release: '${release}'`);
    }

    switch (process.platform) {
      case 'linux': {
        fileExtension = 'deb';
        downloadUrl = `https://dl.google.com/linux/direct/${chromeProduct}_current_amd64.deb`;
        break;
      }
      case 'darwin':
        fileExtension = 'dmg';
        switch (release) {
          case 'stable':
            // Must leave in ggro (brand) as without it, the dmg will be for an
            // old version of Chrome
            downloadUrl = `https://dl.google.com/chrome/mac/universal/stable/ggro/` +
              `googlechrome.dmg`;
            chromeOSXAppName = 'Google Chrome.app';
            break;
          case 'beta':
            downloadUrl = `https://dl.google.com/chrome/mac/beta/` +
              `GoogleChrome.dmg`;
            chromeOSXAppName = 'Google Chrome.app';
            break;
          default:
            throw new Error(`Unknown release: '${release}'`);
        }
        break;
      default:
        throw new Error('Unsupported platform.', process.platform);
    }

    const finalBrowserPath = path.join(installDir, 'chrome', release);
    return new Promise((resolve, reject) => {
      mkdirp(installDir, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
        .then(() => {
          return new Promise((resolve, reject) => {
            const filePath = path.join(installDir, chromeProduct + '.' +
          fileExtension);
            const file = fs.createWriteStream(filePath);
            request(downloadUrl, (err) => {
              if (err) {
                return reject(err);
              }

              resolve(filePath);
            })
                .pipe(file);
          });
        })
        .then((filePath) => {
          return new Promise((resolve, reject) => {
            mkdirp(finalBrowserPath, (err) => {
              if (err) {
                return reject(err);
              }
              resolve(filePath);
            });
          });
        })
        .then((filePath) => {
          switch (fileExtension) {
            case 'deb':
              return new Promise(function(resolve, reject) {
                // dpkg -x app.deb /path/to/target/dir/
                const dpkgProcess = spawn('dpkg', [
                  '-x',
                  filePath,
                  finalBrowserPath,
                ], {stdio: 'inherit'});

                dpkgProcess.on('exit', (code) => {
                  if (code === 0) {
                    return resolve(filePath);
                  }

                  reject(new Error('Unable to extract deb'));
                });
              });
            case 'dmg':
              return new Promise((resolve, reject) => {
                dmg.mount(filePath, (err, mountedPath) => {
                  if (err) {
                    return reject(err);
                  }

                  fse.copySync(
                      path.join(mountedPath, chromeOSXAppName),
                      path.join(installDir, 'chrome', release,
                          chromeOSXAppName),
                      {dereference: true}
                  );

                  dmg.unmount(mountedPath, (err) => {
                    if (err) {
                      reject(err);
                    }

                    resolve();
                  });
                });
              });
            default:
              throw new Error('Unknown file extension: ', fileExtension);
          }
        })
        .then((filePath) => {
          if (filePath) {
            return fse.remove(filePath);
          }
        });
  }

  /**
   * Download a version of Firefox to a specific directory.
   * @param {String} release This should be 'stable', 'beta' or 'unstable'.
   * @param {String} installDir The path to install Firefox into.
   * @return {Promise} Promise that resolves once the download has completed.
   */
  _downloadFirefox(release, installDir) {
    let ffProduct = null;
    let ffPlatformId = null;
    let fileExtension = null;
    let firefoxMacApp = null;

    switch (release) {
      case 'stable':
        firefoxMacApp = 'Firefox.app';
        ffProduct = 'firefox-latest';
        break;
      case 'beta':
        firefoxMacApp = 'Firefox.app';
        ffProduct = 'firefox-beta-latest';
        break;
      case 'unstable':
        firefoxMacApp = 'Firefox Nightly.app';
        ffProduct = 'firefox-nightly-latest';
        break;
      default:
        throw new Error(`Unknown release: '${release}'`);
    }

    switch (process.platform) {
      case 'linux':
        ffPlatformId = 'linux64';
        fileExtension = '.tar.gz';
        break;
      case 'darwin':
        ffPlatformId = 'osx';
        fileExtension = '.dmg';
        break;
      default:
        throw new Error('Unsupport platform.', process.platform);
    }

    const downloadUrl = `https://download.mozilla.org/?product=${ffProduct}&lang=en-US&os=${ffPlatformId}`;
    return new Promise((resolve, reject) => {
      mkdirp(installDir, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
        .then(() => {
          return new Promise((resolve, reject) => {
            const filePath = path.join(installDir, ffProduct + fileExtension);
            const file = fs.createWriteStream(filePath);
            request(downloadUrl, (err) => {
              if (err) {
                return reject(err);
              }

              resolve(filePath);
            })
                .pipe(file);
          });
        })
        .then((filePath) => {
          return new Promise((resolve, reject) => {
            mkdirp(path.join(installDir, 'firefox', release), (err) => {
              if (err) {
                return reject(err);
              }
              resolve(filePath);
            });
          });
        })
        .then((filePath) => {
          if (fileExtension === '.tar.gz') {
            return new Promise((resolve, reject) => {
              const untarProcess = spawn('tar', [
                'xvjf',
                filePath,
                '--directory',
                path.join(installDir, 'firefox', release),
                '--strip-components',
                1,
              ]);

              untarProcess.on('exit', (code) => {
                if (code === 0) {
                  return resolve(filePath);
                }

                reject(new Error('Unable to extract tar'));
              });
            });
          } else if (fileExtension === '.dmg') {
            return new Promise((resolve, reject) => {
              dmg.mount(filePath, (err, mountedPath) => {
                if (err) {
                  return reject(err);
                }

                fse.copySync(
                    path.join(mountedPath, firefoxMacApp),
                    path.join(installDir, 'firefox', release, firefoxMacApp),
                    {dereference: true}
                );

                dmg.unmount(mountedPath, (err) => {
                  if (err) {
                    reject(err);
                  }

                  resolve();
                });
              });
            });
          }

          throw new Error('Unable to handle downloaded file: ', downloadUrl);
        })
        .then((filePath) => {
          if (filePath) {
            return fse.remove(filePath);
          }
        });
  }
}

module.exports = new DownloadManager();
