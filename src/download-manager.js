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
const del = require('del');
const dmg = require('dmg');
const fse = require('fs-extra');
const yauzl = require('yauzl');

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

  _getFirefoxDriverDownloadURL() {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        url: 'https://api.github.com/repos/mozilla/geckodriver/releases',
        headers: {
          'User-Agent': 'request'
        }
      };
      if (process.env.GH_TOKEN) {
        requestOptions.url = requestOptions.url + '?access_token=' +
          process.env.GH_TOKEN;
      }
      request(requestOptions,
      (err, response) => {
        if (err) {
          return reject(err);
        }

        if (response.statusCode !== 200) {
          return reject(new Error('Unable to get valid response for Github. ' +
            JSON.parse(response.body).message));
        }
        const allReleases = JSON.parse(response.body);
        let selectedRelease;
        const blackList = [
          // v0.10.0 requires selenium-webdriver 3.0.0
          // 'v0.10.0'
        ];
        for (let i = 0; i < allReleases.length; i++) {
          const release = allReleases[i];

          // Block releases here if needed
          if (blackList.indexOf(release['tag_name']) !== -1) { // eslint-disable-line dot-notation
            continue;
          }

          if (!selectedRelease) {
            selectedRelease = release;
          }
        }
        const releaseAssets = selectedRelease.assets;
        switch (process.platform) {
          case 'linux':
            releaseAssets.forEach(download => {
              if (download.name.indexOf('linux64') !== -1) {
                return resolve({
                  url: download.browser_download_url,
                  name: download.name
                });
              }
            });
            break;
          case 'darwin':
            releaseAssets.forEach(download => {
              if (download.name.indexOf('mac') !== -1) {
                return resolve({
                  url: download.browser_download_url,
                  name: download.name
                });
              }
            });
            break;
          case 'windows':
            releaseAssets.forEach(download => {
              if (download.name.indexOf('win64') !== -1) {
                return resolve({
                  url: download.browser_download_url,
                  name: download.name
                });
              }
            });
            break;
          default:
            return reject(new Error('Unsupported platform: ' +
              process.platform));
        }

        return reject(new Error('Unable to find appropriate download for ' +
          'this environment.'));
      });
    });
  }

  /**
   * This method retrieves the Firefox Gecko driver, and makes it
   * executable. It's installed to the directory defined via the
   * application get/setInstallDir() and it's added to the processes
   * PATH for use by selenium-webdriver.
   * @return {Promise}              Resolves when the driver is downloaded
   */
  downloadFirefoxDriver() {
    let geckoDriverPath = path.join(
      application.getInstallDirectory(), 'geckodriver');

    // TODO: Should check if geckodriver is up to date but at the moment
    // updates seem critical so probably worth always checking for latest

    return new Promise((resolve, reject) => {
      mkdirp(geckoDriverPath, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
    .then(() => {
      return this._getFirefoxDriverDownloadURL();
    })
    .then(downloadInfo => {
      return new Promise((resolve, reject) => {
        // Make sure we know what we are dealing with
        const expectExtension = '.tar.gz';
        if (downloadInfo.name.indexOf(expectExtension) !==
          (downloadInfo.name.length - expectExtension.length)) {
          return reject(new Error(`Unexpected file extension for ` +
            `${downloadInfo.name}`));
        }

        const filePath = path.join(geckoDriverPath, downloadInfo.name);
        const file = fs.createWriteStream(filePath);

        request(downloadInfo.url, err => {
          if (err) {
            return reject(err);
          }

          resolve({
            filename: downloadInfo.name,
            filePath: filePath
          });
        })
        .pipe(file);
      });
    })
    .then(fileInfo => {
      return new Promise(function(resolve, reject) {
        const untarProcess = spawn('tar', [
          'xvzf',
          fileInfo.filePath,
          '-C',
          geckoDriverPath
        ]);

        untarProcess.on('exit', code => {
          if (code === 0) {
            try {
              const extractedFileName = 'geckodriver';
              fs.chmodSync(path.join(geckoDriverPath, extractedFileName),
                '755');
              return resolve(fileInfo.filePath);
            } catch (err) {
              return reject(err);
            }
          }

          reject(new Error('Unable to extract tar'));
        });
      });
    })
    .then(filePath => {
      return del(filePath, {force: true});
    });
  }

  /**
   * This method will download a browser if it is needed (i.e. can't be found
   * in the usual system location or in the install directory).
   * @param  {String} browserId This is the Selenium ID of the browser you wish
   *                            to download ('chrome', 'firefox', 'opera').
   * @param  {String} release   This downloads the browser on a particular track
   *                            and can be 'stable', 'beta' or 'unstable'
   * @param  {Boolean} [force=false]
   *         										 If you want to install the browser regardless
   *                             of any existing installs of the process, pass
   *                             in true.
   * @return {Promise}           Promise resolves once the browser has been
   *                             downloaded and ready for use.
   */
  downloadBrowser(browserId, release, force) {
    let forceDownload = force || false;
    let installDir = application.getInstallDirectory();

    const browserInstance = browserManager
      .createWebDriverBrowser(browserId, release);
    if (!forceDownload && browserInstance.isValid()) {
      return Promise.resolve();
    }

    switch (browserId) {
      case 'chrome':
        return this._downlaodChrome(release, installDir);
      case 'firefox':
        return this._downloadFirefox(release, installDir);
      case 'opera':
        return this._downloadOpera(release, installDir);
      default:
        throw new Error(`Apologies, but ${browserId} can't be downloaded ` +
          `with this tool`);
    }
  }

  _downlaodChrome(release, installDir) {
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
      case 'unstable':
        chromeProduct = 'google-chrome-unstable';
        break;
      default:
        throw new Error('Unknown release.', release);
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
            // Must leave in GGRO as without it, the dmg will be for an
            // old version of Chrome
            downloadUrl = `https://dl.google.com/chrome/mac/stable/GGRO/` +
              `googlechrome.dmg`;
            chromeOSXAppName = 'Google Chrome.app';
            break;
          case 'beta':
            downloadUrl = `https://dl.google.com/chrome/mac/beta/` +
              `GoogleChrome.dmg`;
            chromeOSXAppName = 'Google Chrome.app';
            break;
          case 'unstable':
            downloadUrl = `https://dl.google.com/chrome/mac/dev/` +
              `GoogleChrome.dmg`;
            chromeOSXAppName = 'Google Chrome.app';
            break;
          default:
            throw new Error('Unknown release type: ' + release);
        }
        break;
      default:
        throw new Error('Unsupport platform.', process.platform);
    }

    const finalBrowserPath = path.join(installDir, 'chrome', release);
    return new Promise((resolve, reject) => {
      mkdirp(installDir, err => {
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
        request(downloadUrl, err => {
          if (err) {
            return reject(err);
          }

          resolve(filePath);
        })
        .pipe(file);
      });
    })
    .then(filePath => {
      return new Promise((resolve, reject) => {
        mkdirp(finalBrowserPath, err => {
          if (err) {
            return reject(err);
          }
          resolve(filePath);
        });
      });
    })
    .then(filePath => {
      switch (fileExtension) {
        case 'deb':
          return new Promise(function(resolve, reject) {
            // dpkg -x app.deb /path/to/target/dir/
            const dpkgProcess = spawn('dpkg', [
              '-x',
              filePath,
              finalBrowserPath
            ], {stdio: 'inherit'});

            dpkgProcess.on('exit', code => {
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
                path.join(installDir, 'chrome', release, chromeOSXAppName)
              );

              dmg.unmount(mountedPath, err => {
                if (err) {
                  console.error('Unable to unmount dmg.');
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
    .then(filePath => {
      return del(filePath, {force: true});
    });
  }

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
        firefoxMacApp = 'FirefoxNightly.app';
        ffProduct = 'firefox-nightly-latest';
        break;
      default:
        throw new Error('Unknown release.', release);
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
      mkdirp(installDir, err => {
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
        request(downloadUrl, err => {
          if (err) {
            return reject(err);
          }

          resolve(filePath);
        })
        .pipe(file);
      });
    })
    .then(filePath => {
      return new Promise((resolve, reject) => {
        mkdirp(path.join(installDir, 'firefox', release), err => {
          if (err) {
            return reject(err);
          }
          resolve(filePath);
        });
      });
    })
    .then(filePath => {
      if (fileExtension === '.tar.gz') {
        return new Promise((resolve, reject) => {
          const untarProcess = spawn('tar', [
            'xvjf',
            filePath,
            '--directory',
            path.join(installDir, 'firefox', release),
            '--strip-components',
            1
          ]);

          untarProcess.on('exit', code => {
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
              path.join(installDir, 'firefox', release, firefoxMacApp)
            );

            dmg.unmount(mountedPath, err => {
              if (err) {
                console.error('Unable to unmount dmg.');
                reject(err);
              }

              resolve();
            });
          });
        });
      }

      throw new Error('Unable to handle downloaded file: ', downloadUrl);
    })
    .then(filePath => {
      return del(filePath, {force: true});
    });
  }

  _downloadOpera(release, installDir) {
    let downloadUrl;
    let fileExtension = null;
    let operaProduct = null;
    let operaOSXAppName = null;

    switch (release) {
      case 'stable':
        operaProduct = 'opera-stable';
        break;
      case 'beta':
        operaProduct = 'opera-beta';
        break;
      case 'unstable':
        operaProduct = 'opera-unstable';
        break;
      default:
        throw new Error('Unknown release.', release);
    }

    switch (process.platform) {
      case 'linux':
        fileExtension = 'deb';
        switch (release) {
          case 'stable':
            downloadUrl = 'http://www.opera.com/download/get/?id=39598&location=413&nothanks=yes&sub=marine';
            break;
          case 'beta':
            downloadUrl = 'http://www.opera.com/download/get/?id=39574&location=410&nothanks=yes&sub=marine';
            break;
          case 'unstable':
            downloadUrl = 'http://www.opera.com/download/get/?id=39580&location=413&nothanks=yes&sub=marine';
            break;
          default:
            throw new Error('Unknown release.', release);
        }
        break;
      case 'darwin':
        fileExtension = 'zip';
        switch (release) {
          case 'stable':
            operaOSXAppName = 'Opera Installer.app';
            downloadUrl = 'http://net.geo.opera.com/opera/stable/mac';
            break;
          case 'beta':
            operaOSXAppName = 'Opera Beta Installer.app';
            downloadUrl = 'http://net.geo.opera.com/opera/beta/mac';
            break;
          case 'unstable':
            operaOSXAppName = 'Opera Developer Installer.app';
            downloadUrl = 'http://net.geo.opera.com/opera/developer/mac';
            break;
          default:
            throw new Error('Unknown release.', release);
        }
        break;
      default:
        throw new Error('Unsupported platform for opera: ' + process.platform);
    }

    const finalBrowserPath = path.join(installDir, 'opera', release);
    return new Promise((resolve, reject) => {
      mkdirp(installDir, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(installDir, operaProduct + '.' +
          fileExtension);
        const file = fs.createWriteStream(filePath);
        request(downloadUrl, err => {
          if (err) {
            return reject(err);
          }

          resolve(filePath);
        })
        .pipe(file);
      });
    })
    .then(filePath => {
      // On Os X, the Installer runs so you can't define where to save it.
      if (process.platform !== 'darwin') {
        return new Promise((resolve, reject) => {
          mkdirp(finalBrowserPath, err => {
            if (err) {
              return reject(err);
            }
            resolve(filePath);
          });
        });
      }

      return filePath;
    })
    .then(filePath => {
      switch (fileExtension) {
        case 'deb':
          return new Promise(function(resolve, reject) {
            // dpkg -x app.deb /path/to/target/dir/
            const dpkgProcess = spawn('dpkg', [
              '-x',
              filePath,
              finalBrowserPath
            ], {stdio: 'inherit'});

            dpkgProcess.on('exit', code => {
              if (code === 0) {
                return resolve(filePath);
              }

              reject(new Error('Unable to extract deb'));
            });
          });
        case 'zip':
          return new Promise(function(resolve, reject) {
            yauzl.open(filePath, {lazyEntries: true}, function(err, zipfile) {
              if (err) {
                return reject(err);
              }

              zipfile.readEntry();
              zipfile.on('entry', entry => {
                try {
                  // directory file names end with '/'
                  if (/\/$/.test(entry.fileName)) {
                    mkdirp.sync(
                      path.join(
                        application.getInstallDirectory(),
                        entry.fileName
                      )
                    );

                    zipfile.readEntry();
                  } else {
                    // file entry
                    zipfile.openReadStream(entry, (err, readStream) => {
                      if (err) {
                        return reject(err);
                      }

                      // ensure parent directory exists
                      mkdirp.sync(
                        path.join(
                          application.getInstallDirectory(),
                          path.dirname(entry.fileName)
                        )
                      );

                      const entryPath = path.join(
                        application.getInstallDirectory(),
                        entry.fileName
                      );
                      readStream.pipe(
                        fs.createWriteStream(entryPath)
                      );

                      readStream.on('end', () => {
                        fs.chmodSync(entryPath, '755');

                        zipfile.readEntry();
                      });
                    });
                  }
                } catch (err) {
                  reject(err);
                }
              });
              zipfile.on('end', () => {
                zipfile.close();
                resolve(filePath);
              });
            });
          })
          .then(filePath => {
            const currentAppPath = path.join(application.getInstallDirectory(),
              operaOSXAppName);
            return new Promise((resolve, reject) => {
              const openProcess = spawn('open', [
                '--wait-apps',
                currentAppPath
              ], {stdio: 'inherit'});

              openProcess.on('exit', code => {
                if (code === 0) {
                  // It worked
                  return resolve(filePath);
                }

                reject(new Error('Unable to open installer ' + code));
              });
            })
            .then(filePath => {
              return del(currentAppPath, {force: true})
              .then(() => filePath);
            });
          });
        default:
          throw new Error('Unknown file extension');
      }
    })
    .then(filePath => {
      return del(filePath, {force: true});
    });
  }
}

module.exports = new DownloadManager();
