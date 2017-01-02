---
layout: index
title: "Selenium Assistant"
navigation_weight: 0
left_column: |
  # Why

  This library is designed to make using selenium a little easier in terms
  of finding different releases of a particular browser and
  generating a web driver instance for it.
right_column: |
  # Install

  Installing of this module is simply:

      npm install selenium-assistant --save-dev

---
# Usage

Depending on the browsers you wish to test against you'll need to add
the drivers for them.

To use **Google Chrome**:

    npm install chromedriver --save-dev

To use **Opera**:

    npm install operadriver --save-dev

To use **Firefox**:

    npm install geckodriver --save-dev

## Local Browsers

The most basic / common use of this library to get the available browsers
on the current machine, filter out any browsers you may not want and
then get a web driver instance for that browser, this can be done like so:

```javascript
const seleniumAssistant = require('selenium-assistant');

const browsers = seleniumAssistant.getLocalBrowsers();
browsers.forEach(browser => {
  // Skip if the browser isn't stable.
  if (browser.getReleaseName() !== 'stable') {
    return;
  }

  // Print out the browsers name.
  console.log(browsers.getPrettyName());

  browser.getSeleniumDriver()
  .then(webdriverInstance => {
    return webdriverInstance.get('https://google.com/');
  })
  .then(() => {
    return globalDriver.wait(selenium.until.titleIs('Google'), 1000);
  });
});
```

Make sure you checkout the reference docs for all the available APIs.

For documentation on how to use the `webdriverInstace` [check out the
selenium docs](http://seleniumhq.github.io/selenium/docs/api/javascript/).

## Saucelabs Browsers

There will come a point where you'll want to test on browsers you don't have
on your local machine (i.e. Internet Explorer or Safari).

Selenium-assistant can help with this, exposing methods so that you can:

1. Set your Saucelabs username and access key.
1. Use Saucelabs connect so Saucelabs browsers can access local servers.
3. Get a working driver instance (i.e. have the correct configuration).

```javascript
const seleniumAssistant = require('selenium-assistant');

seleniumAssistant.setSaucelabsDetails(
  SAUCELABS_USERNAME,
  SAUCELABS_ACCESS_KEY);

seleniumAssistant.startSaucelabsConnect()
.then(() => {
 return seleniumAssistant.getSauceLabsBrowser('edge', 'latest');
})
.then((browserInstance) => {
  return browserInstance.getSeleniumDriver();
})
.then((driver) => {
  return driver.get('http://localhost:8080/')
  .then(() => {
    // Do any testing with the driver.
  })
  .then(() => {
    return seleniumAssistant.killWebDriver(driver);
  });
})
.then(() => {
  return seleniumAssistant.stopSaucelabsConnect();
});
```

> **Note:** You don't need Saucelabs connect if you are testing a publicly
> available URL.
