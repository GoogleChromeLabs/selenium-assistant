const seleniumEdge = require('selenium-webdriver/edge');

/**
 * This is a helper class that contains the base pieces of
 * web driver info.
 */
class Edge {
  /**
   * Basic constructor.
   */
  constructor() {
    this._id = 'microsoftedge';
    this._options = new seleniumEdge.Options();
    this._prettyName = 'Microsoft Edge';
    this._prettyReleaseNames = {
      stable: 'Stable',
    };
  }
}

module.exports = Edge;
