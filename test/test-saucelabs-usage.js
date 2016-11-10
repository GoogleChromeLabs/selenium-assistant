const path = require('path');
const TestServer = require('./helpers/test-server.js');
const seleniumAssistant = require('../src/index.js');
const selenium = require('selenium-webdriver');

function addTests(username, accessKey) {
  describe('Test Saucelabs', function() {

    const badSaucelabBrowsers = [
      'firefox'
    ];

    const saucelabBrowsers = [
      'chrome',
      'safari',
      'edge',
      'ie',
    ];

    let globalDriver;
    let globalServer = new TestServer(false);

    before(function() {
      const serverPath = path.join(__dirname, 'data', 'example-site');
      return globalServer.startServer(serverPath)
      .then((portNumber) => {
        localURL = `http://localhost:${portNumber}/`;
      });
    });

    after(function() {
      this.timeout(6000);

      return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
      .then(() => {
        return globalServer.killServer();
      });
    });

    function testNormalSeleniumUsage(specificBrowser) {
      return specificBrowser.getSeleniumDriver()
      .then((driver) => {
        globalDriver = driver;
      })
      .then(() => {
        return globalDriver.get('https://gauntface.com/')
        .then(() => {
          return globalDriver.wait(selenium.until.titleIs('Gaunt Face | Matt Gaunt'), 1000);
        });
      })
      .then(() => seleniumAssistant.killWebDriver(globalDriver))
      .then(() => {
        globalDriver = null;
      });
    }

    it('should reject for bad saucelab details', function() {

    });

    it('should reject when no saucelab details', function() {

    });

    it('should reject on bad browser input', function() {

    });

    saucelabBrowsers.forEach((browser) => {
      const version = 'latest';
      it(`should be able to use saucelab browser ${browser} - ${version}`, function() {
        this.timeout(5 * 60 * 1000);

        seleniumAssistant.setSaucelabDetails(username, accessKey);
        const webdriverBrowser = seleniumAssistant.getSaucelabsBrowser(browser,
          version, {
            name: `selenium-assistant/unit-test/${browser}/${version}`,
          });
        return testNormalSeleniumUsage(webdriverBrowser);
      });
    });
  });
}

if (process.env['SAUCELABS_USERNAME'] &&
  process.env['SAUCELABS_ACCESS_KEY']) {
  addTests(process.env['SAUCELABS_USERNAME'],
    process.env['SAUCELABS_ACCESS_KEY']);
} else {
  console.warn('Skipping saucelabs tests due to no credentials in environment');
}
