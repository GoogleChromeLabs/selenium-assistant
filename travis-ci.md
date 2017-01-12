---
layout: index
title: "Travis CI Support"
navigation_weight: 1
---
Selenium-Assistant can be easily used with Travis.

All you need to do is create a "Virtual Display", which is required for the
browsers to work:

In your `.travis.yml` file, run:

    # Read more here: https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI
    before_script:
      - "export DISPLAY=:99.0"
      - "sh -e /etc/init.d/xvfb start || echo \"Unable to start virtual display.\""
      - sleep 3 # give xvfb some time to start

If you want to speed up your travis times and your downloading browsers, add
the following to your `.travis.yml` file and the browser downloads should
be cached between runs.

    cache:
      directories:
        - node_modules
        - ~/.selenium-assistant
