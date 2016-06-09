'use strict';

const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const request = require('request');
const mkdirp = require('mkdirp');
const del = require('del');

const browserManager = require('./browser-manager.js');

class DownloadManager {
  getDefaultInstallLocation() {
    let installLocation;
    const homeLocation = process.env.HOME || process.env.USERPROFILE;
    if (homeLocation) {
      installLocation = homeLocation;
    } else {
      installLocation = '.';
    }

    const folderName = process.platform === 'win32' ?
      'selenium-wrapper-browsers' : '.selenium-wrapper-browsers';
    return path.join(installLocation, folderName);
  }

  /**
   * The options object for downloadBrowser.
   *
   * @typedef {Object} BrowserDownloadOptions
   * @property {String} [installDir='$HOME/.selenium-wrapper-browsers/'] The directory to download cached browsers to
   * @property {Boolean} [force=false]   Forces the browser to be downloaded
   */

  downloadBrowser(browserId, release, options) {
    options = options || {};

    let installDir = options.installDir;
    let forceDownload = options.force || false;

    if (!installDir) {
      installDir = this.getDefaultInstallLocation();
    }

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
    let chromeProduct = null;
    let chromePlatformId = null;

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
      case 'linux':
        chromePlatformId = 'linux';
        break;
      default:
        throw new Error('Unsupport platform.', process.platform);
    }

    const downloadUrl = `https://dl.google.com/${chromePlatformId}/direct/${chromeProduct}_current_amd64.deb`;
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
        const filePath = path.join(installDir, chromeProduct + '.deb');
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
        mkdirp(path.join(installDir, chromeProduct), err => {
          if (err) {
            return reject(err);
          }
          resolve(filePath);
        });
      });
    })
    .then(filePath => {
      return new Promise(function(resolve, reject) {
        // dpkg -x app.deb /path/to/target/dir/
        const dpkgProcess = spawn('dpkg', [
          '-x',
          filePath,
          path.join(installDir, chromeProduct)
        ], {stdio: 'inherit'});

        dpkgProcess.on('exit', code => {
          if (code === 0) {
            return resolve(filePath);
          }

          reject(new Error('Unable to extract deb'));
        });
      });
    })
    .then(filePath => {
      return del(filePath);
    });
  }

  _downloadFirefox(release, installDir) {
    let ffProduct = null;
    let ffPlatformId = null;

    switch (release) {
      case 'stable':
        ffProduct = 'firefox-latest';
        break;
      case 'beta':
        ffProduct = 'firefox-beta-latest';
        break;
      case 'unstable':
        ffProduct = 'firefox-nightly-latest';
        break;
      default:
        throw new Error('Unknown release.', release);
    }

    switch (process.platform) {
      case 'linux':
        ffPlatformId = 'linux64';
        break;
      case 'darwin':
        ffPlatformId = 'osx';
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
        const filePath = path.join(installDir, ffProduct + '.tar.gz');
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
        mkdirp(path.join(installDir, ffProduct), err => {
          if (err) {
            return reject(err);
          }
          resolve(filePath);
        });
      });
    })
    .then(filePath => {
      return new Promise(function(resolve, reject) {
        const untarProcess = spawn('tar', [
          'xvjf',
          filePath,
          '--directory',
          path.join(installDir, ffProduct),
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
    })
    .then(filePath => {
      return del(filePath);
    });
  }

  _downloadOpera(release, installDir) {
    let operaProduct = null;
    let downloadUrl = null;

    switch (release) {
      case 'stable':
        operaProduct = 'opera-stable';
        downloadUrl = 'http://www.opera.com/download/get/?id=39598&location=413&nothanks=yes&sub=marine';
        break;
      case 'beta':
        operaProduct = 'opera-beta';
        downloadUrl = 'http://www.opera.com/download/get/?id=39574&location=410&nothanks=yes&sub=marine';
        break;
      case 'unstable':
        operaProduct = 'opera-unstable';
        downloadUrl = 'http://www.opera.com/download/get/?id=39580&location=413&nothanks=yes&sub=marine';
        break;
      default:
        throw new Error('Unknown release.', release);
    }

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
        const filePath = path.join(installDir, operaProduct + '.deb');
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
        mkdirp(path.join(installDir, operaProduct), err => {
          if (err) {
            return reject(err);
          }
          resolve(filePath);
        });
      });
    })
    .then(filePath => {
      return new Promise(function(resolve, reject) {
        // dpkg -x app.deb /path/to/target/dir/
        const dpkgProcess = spawn('dpkg', [
          '-x',
          filePath,
          path.join(installDir, operaProduct)
        ], {stdio: 'inherit'});

        dpkgProcess.on('exit', code => {
          if (code === 0) {
            return resolve(filePath);
          }

          reject(new Error('Unable to extract deb'));
        });
      });
    })
    .then(filePath => {
      return del(filePath);
    });
  }
}

module.exports = new DownloadManager();
