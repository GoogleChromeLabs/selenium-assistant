'use strict';

const ChromeWebDriverBrowser = require('./webdriver-browser/chrome');
const FirefoxWebDriverBrowser = require('./webdriver-browser/firefox');
const OperaWebDriverBrowser = require('./webdriver-browser/opera');

class BrowserManager {
  constructor() {
    this._webdriveBrowsers = [
      this.createWebDriverBrowser('chrome', 'stable'),
      this.createWebDriverBrowser('chrome', 'beta'),
      this.createWebDriverBrowser('chrome', 'unstable'),

      this.createWebDriverBrowser('firefox', 'stable'),
      this.createWebDriverBrowser('firefox', 'beta'),
      this.createWebDriverBrowser('firefox', 'unstable'),

      this.createWebDriverBrowser('opera', 'stable'),
      this.createWebDriverBrowser('opera', 'beta'),
      this.createWebDriverBrowser('opera', 'unstable')
    ];
  }

  getSupportedBrowsers() {
    return this._webdriveBrowsers;
  }

  createWebDriverBrowser(browserId, release) {
    switch (browserId) {
      case 'chrome':
        return new ChromeWebDriverBrowser(release);
      case 'firefox':
        return new FirefoxWebDriverBrowser(release);
      case 'opera':
        return new OperaWebDriverBrowser(release);
      default:
        throw new Error('Unknown web driver browser request: ', browserId);
    }
  }
}

module.exports = new BrowserManager();
