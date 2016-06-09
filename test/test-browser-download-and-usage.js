'use strict';

describe('Test Download and Usage of Browsers', function() {
  const browserManager = require('../src/browser-manager.js');

  it('should return the downloaded browsers path as valid', function() {
    const allBrowsers = browserManager.getSupportedBrowsers();
    allBrowsers.forEach(browser => {
      console.log(browser.getExecutablePath());
    });
  });
});
