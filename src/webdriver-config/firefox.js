const seleniumFirefox = require('selenium-webdriver/firefox');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Firefox {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'firefox';
    this._options = new seleniumFirefox.Options();
    this._prettyName = 'Firefox';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Nightly',
    };
    this._driverModule = 'geckodriver';
  }
}

module.exports = Firefox;
