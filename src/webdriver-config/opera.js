const seleniumOpera = require('selenium-webdriver/opera');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Opera {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'opera';
    this._options = new seleniumOpera.Options();
    this._prettyName = 'Opera';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Beta',
      unstable: 'Developer',
    };
    this._driverModule = 'operadriver';
  }
}

module.exports = Opera;
