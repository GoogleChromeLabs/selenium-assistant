const fs = require('fs');
const path = require('path');
const semver = require('semver');
const execSync = require('child_process').execSync;
const Browser = require('./browser.js');

/**
 * Local browser is an abstract class with some implemented methods
 * and some methods that MUST be overriden.
 */
class LocalBrowser extends Browser {
  /**
   * Constructs new local browser.
   * @param {Object} options TODO This should be a shared webdriver config
   * class.
   * @param {string} release Release name must be 'stable', 'beta' or
   * 'unstable'.
   */
  constructor(options, release, blacklist) {
    super(options);
    this._release = release;
    this._blacklist = blacklist;
  }
  /* eslint-disable valid-jsdoc */
  /**
   * To get the path of the browsers executable file, call this method.
   * @return {String} Path of the browsers executable file or null if
   * it can't be found.
   */
  getExecutablePath() {
    throw new Error('getExecutablePath() must be overriden by subclasses');
  }
  /* eslint-enable valid-jsdoc */

  /**
   * <p>This method returns true if the instance can be found and can create a
   * selenium driver that will launch the expected browser.</p>
   *
   * <p>A scenario where it will be unable to produce a valid selenium driver
   * is if the browsers executable path can't be found.</p>
   *
   * @return {Boolean} True if a selenium driver can be produced
   */
  isValid() {
    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return false;
    }

    try {
      // This will throw if it's not found
      fs.lstatSync(executablePath);

      const minVersion = this._getMinSupportedVersion();
      if (minVersion) {
        return this.getVersionNumber() >= minVersion;
      }

      if (this.isBlackListed()) {
        return false;
      }

      return true;
    } catch (error) {
      // NOOP
    }

    return false;
  }

  isBlackListed() {
    return false;
  }

  /**
   * If you need to identify a browser based on it's version number but
   * the high level version number isn't specific enough, you can use the
   * raw version string (this will be the result of calling the browser
   * executable with an appropriate flag to get the version)
   * @return {String} Raw string that identifies the browser
   */
  getRawVersionString() {
    if (this._rawVerstionString) {
      return this._rawVerstionString;
    }

    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      return null;
    }

    this._rawVerstionString = null;

    try {
      this._rawVerstionString = execSync(`"${executablePath}" --version`)
        .toString();
    } catch (err) {
      // NOOP
    }

    return this._rawVerstionString;
  }

  /**
   * <p>This method resolves to a webdriver instance of this browser i
   * nstance.</p>
   *
   * <p>For more info, see:
   * {@link http://selenium.googlecode.com/git/docs/api/javascript/class_webdriver_WebDriver.html | WebDriver Docs}</p>
   *
   * @return {Promise<WebDriver>} [description]
   */
  getSeleniumDriver() {
    if (this.getDriverModule()) {
      try {
        // This will require the necessary driver module that will add the
        // driver executable to the current path.
        const moduleThing = require(this.getDriverModule());
        // The operadriver module DOESNT add the driver to the current path.
        if (this.getId() === 'opera') {
          // Operadriver.path includes the executable name which upsets
          // selenium and finding the operadriver executable.
          process.env.PATH += path.delimiter + path.dirname(moduleThing.path);
        }
      } catch (err) {
        /* eslint-disable no-console */
        console.warn(`You are attempting to use ${this.getPrettyName} but ` +
          `the node module '${this.getDriverModule()}' was not found. Make ` +
          `sure it's in your dependency list.`);
        /* eslint-enable no-console */
      }
    }
    try {
      const builder = this.getSeleniumDriverBuilder();
      const buildResult = builder.build();
      if (buildResult.then) {
        return buildResult;
      }
      return Promise.resolve(buildResult);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Get the minimum supported browser version for this browser.
   * @return {number} The minimum supported version number.
   */
  _getMinSupportedVersion() {
    return false;
  }

  /**
   * <p>The release name for this browser, either 'stable', 'beta',
   * 'unstable'.</p>
   *
   * <p>Useful if you only want to test <i>or</i> not test on a particular
   * release type.</p>
   * @return {String} Release name of browser. 'stable', 'beta' or 'unstable'
   */
  getReleaseName() {
    return this._release;
  }
}

module.exports = LocalBrowser;
