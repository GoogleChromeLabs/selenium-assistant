const path = require('path');
const fs = require('fs');
const TestServer = require('./helpers/test-server.js');
const seleniumAssistant = require('../src/index.js');
const selenium = require('selenium-webdriver');

if (!process.env['SAUCELABS_USERNAME'] ||
  !process.env['SAUCELABS_ACCESS_KEY']) {
  console.warn('Skipping saucelabs tests due to no credentials in environment');
  return;
}

const TIMEOUT = 10 * 60 * 1000;
const RETRIES = 1;

const SAUCELABS_USERNAME = process.env['SAUCELABS_USERNAME'];
const SAUCELABS_ACCESS_KEY = process.env['SAUCELABS_ACCESS_KEY'];

const RELEASES = [
  'latest',
];

describe('Test Saucelabs', function() {
  this.timeout(TIMEOUT);
  this.retries(RETRIES);

  let globalDriver;
  let globalServer = new TestServer(false);
  let localURL;

  before(function() {
    const serverPath = path.join(__dirname, 'data', 'example-site');
    return globalServer.startServer(serverPath, 7000)
    .then((portNumber) => {
      localURL = `http://localhost:${portNumber}/`;
    })
    .then(() => {
      seleniumAssistant.setSaucelabsDetails(
        SAUCELABS_USERNAME,
        SAUCELABS_ACCESS_KEY);
      return seleniumAssistant.enableSaucelabsConnect();
    });
  });

  after(function() {
    return seleniumAssistant.killWebDriver(globalDriver).catch(() => {})
    .then(() => {
      return seleniumAssistant.disableSaucelabsConnect();
    })
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
      return globalDriver.get(localURL)
      .then(() => {
        return globalDriver.wait(selenium.until.titleIs('Example Site'), 5 * 60 * 1000);
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

  function setupTest(saucelabsBrowser) {
    it(`should be able to use saucelab browser ${saucelabsBrowser.getPrettyName()}`, function() {
      this.timeout(5 * 60 * 1000);

      /** const webdriverBrowser = seleniumAssistant.getSaucelabsBrowser(browser,
        version, {
          name: `selenium-assistant/unit-test/${browser}/${version}`,
        });**/
      return testNormalSeleniumUsage(saucelabsBrowser);
    });
  }

  const saucelabBrowserFiles = fs.readdirSync('./src/saucelabs-browsers');
  saucelabBrowserFiles.forEach((saucelabsBrowserFile) => {
    if (saucelabsBrowserFile !== 'edge.js') {
      return;
    }

    const SaucelabBrowserClass = require(`./../src/saucelabs-browsers/${saucelabsBrowserFile}`);
    RELEASES.forEach((release) => {
      const saucelabsBrowser = new SaucelabBrowserClass(release);
      setupTest(saucelabsBrowser);
    });
  });
});
