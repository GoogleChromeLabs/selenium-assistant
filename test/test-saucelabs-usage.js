const path = require('path');
const TestServer = require('./helpers/test-server.js');
const seleniumAssistant = require('../src/index.js');
const selenium = require('selenium-webdriver');

function addTests(username, accessKey) {
  describe('Test Saucelabs', function() {

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
      console.log('Getting the selenium driver');
      return specificBrowser.getSeleniumDriver()
      .then((driver) => {
        console.log('Got driver.');
        globalDriver = driver;
      })
      .then(() => {
        console.log('Getting the URL');
        return globalDriver.get('https://gauntface.com/')
        .then(() => {
          console.log('Got the URL.');
          return globalDriver.wait(selenium.until.titleIs('Gaunt Face | Matt Gaunt'), 1000);
        });
      })
      .then(() => {
        console.log('Got the page title');
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

    it('should be able to use saucelab browser', function() {
      this.timeout(30 * 60 * 1000);

      seleniumAssistant.setSaucelabDetails(username, accessKey);
      const browser = seleniumAssistant.getSaucelabsBrowser('chrome',
        'latest',{
          name: 'selenium-assistant/unit-test'
        });
      return testNormalSeleniumUsage(browser);
    });
  });
}

if (process.env['SAUCELABS_USERNAME'] &&
  process.env['SAUCELABS_ACCESS_KEY']) {
  addTests(process.env['SAUCELABS_USERNAME'],
    process.env['SAUCELABS_ACCESS_KEY']);
}
