const seleniumIE = require('selenium-webdriver/ie');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class IE {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'internet explorer';
    this._options = new seleniumIE.Options();
    this._prettyName = 'Internet Explorer';
    this._prettyReleaseNames = {
      stable: 'Stable',
    };
  }
}

module.exports = IE;
