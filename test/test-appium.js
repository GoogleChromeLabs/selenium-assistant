'use strict';

const seleniumAssistant = require('../src/index.js');
const webdriver = require('selenium-webdriver');

let globalDriver;

describe('Test Appium', function() {
  this.timeout(60000);

  afterEach(function() {
    return seleniumAssistant.killWebDriver(globalDriver);
  });

  it('should launch chrome for mobile using plain', function() {
    console.log('ANDROID_HOME = ', process.env.ANDROID_HOME);

    return new webdriver.Builder()
      .usingServer('http://localhost:4723/wd/hub')
      .withCapabilities({
        platformName: 'Android',
        // platformVersion: '6.0.1',
        deviceName: 'This field is ignored for Android but still required',
        browserName: 'chrome',
        appPackage: 'com.chrome.beta',
        // Found using: adb shell pm dump com.chrome.beta | grep -A 1 MAIN
        appActivity: 'com.google.android.apps.chrome.Main',
        udid: '00897d867c4e99b7'
      })
      .buildAsync()
      .then(driver => {
        console.log('Got the driver');
        globalDriver = driver;
      })
      .then(() => {
        return globalDriver.executeScript(function() {
          return navigator.userAgent;
        });
      })
      .then(userAgent => {
        console.log('User Agent = ', userAgent);
      })
      .then(() => {
        return globalDriver.get('https://google.com')
        .then(() => {
          return globalDriver.wait(webdriver.until.titleIs('Google'), 1000);
        });
      });
  });

  it('should launch chrome for module using assistant driver', function() {
    const browserInfo = seleniumAssistant.getBrowser('chrome', 'stable');
    let builder = browserInfo.getSeleniumDriverBuilder();
    builder = builder.usingServer('http://localhost:4723/wd/hub')
    .withCapabilities({
      platformName: 'Android',
      // platformVersion: '6.0.1',
      deviceName: 'This field is ignored for Android but still required',
      browserName: 'chrome',
      // appPackage: 'com.android.chrome',
      // appPackage: 'com.chrome.beta',
      udid: 'ZL2GLMB5A3105877'
    });
    return builder.buildAsync()
    .then(driver => {
      console.log('Got the driver');
      globalDriver = driver;
    })
    .then(() => {
      return globalDriver.get('https://google.com')
      .then(() => {
        return globalDriver.wait(webdriver.until.titleIs('Google'), 1000);
      });
    });
  });
});
