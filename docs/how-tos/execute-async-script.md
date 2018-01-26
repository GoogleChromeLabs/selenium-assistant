---
layout: index
title: "Execute Async Script"
navigation_weight: 1
---
If you run code in the browser, `executeScript()` expects the
code to return immediately.

`executeAsyncScript()` allows you to run code in the browser
but expect an asynchronous result (i.e. it waits for a
callback);

```javascript
const chromeBrowser = seleniumAssistant.getLocalBrowser('chrome', 'stable');
const driver = await chromeBrowser.getSeleniumDriver();
const value = driver.executeAsyncScript((inputString, ...args) => {
  const cb = args[args.length - 1];

  setTimeout(() => {
    cb(inputString);
  }, 2000);
}, 'example-string');
```

If the async script takes too long to execute, you can extend it with
the following:

```javascript
const chromeBrowser = seleniumAssistant.getLocalBrowser('chrome', 'stable');
const driver = await chromeBrowser.getSeleniumDriver();
driver.manage().timeouts().setScriptTimeout(60 * 1000);
```
