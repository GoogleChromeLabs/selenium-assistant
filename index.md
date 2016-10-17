---
layout: index
title: "Selenium Assistant"
navigation_weight: 0
---
# Why

This library is designed to make using selenium a little easier in terms
of finding different releases of a particular browser and
generating a web driver instance for it.

# Install

Installing of this module is simply:

    npm install selenium-assistant --save-dev

Depending on the browsers you wish to test against you'll need to add
the drivers for them.

To use **Google Chrome**:

    npm install chromedriver --save-dev

To use **Opera**:

    npm install operadriver --save-dev

To use **Firefox**:

    npm install geckodriver --save-dev

# Usage

The most basic / common use of this library to get the available browsers,
filter out any browsers you may not want and then get a web driver instance
for that browser, this can be done like so:

    const seleniumAssistant = require('selenium-assistant');
    seleniumAssistant.printAvailableBrowserInfo();

    const browsers = seleniumAssistant.getAvailableBrowsers();
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

Make sure you checkout the reference docs for all the available APIs.

For documentation on how to use the `webdriverInstace` [check out the
selenium docs](http://seleniumhq.github.io/selenium/docs/api/javascript/).
