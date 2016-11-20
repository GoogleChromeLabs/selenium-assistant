const seleniumSafari = require('selenium-webdriver/safari');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Safari {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'safari';
    this._options = new seleniumSafari.Options();
    this._prettyName = 'Safari';
    this._prettyReleaseNames = {
      stable: 'Stable',
      beta: 'Technology Preview',
    };
  }
}

module.exports = Safari;
