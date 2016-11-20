const seleniumChrome = require('selenium-webdriver/chrome');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Chrome {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'chrome';
    this._options = new seleniumChrome.Options();
    this._prettyName = 'Google Chrome';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Dev',
    };
    this._driverModule = 'chromedriver';
  }
}

module.exports = Chrome;
