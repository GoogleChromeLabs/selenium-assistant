---
layout: index
title: "Use Headless Chrome"
navigation_weight: 1
---
It's possible to use headless Chrome by setting a simple option.

```javascript
const chromeBrowser = seleniumAssistant.getLocalBrowser('chrome', 'stable');
const options = chromeBrowser.getSeleniumOptions();
options.addArguments('--headless');
```

You can learn more [here](https://developers.google.com/web/updates/2017/04/headless-chrome).
