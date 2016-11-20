class Browser {
  constructor(config) {
    if (typeof config === 'undefined' || config === null ||
      typeof config !== 'object') {
      throw new Error('No browser config provided.');
    }

    this._config = config;
  }

  getId() {
    return this._config._id;
  }

  getDriverModule() {
    return this._config._driverModule;
  }

  /**
   * A user friendly name for the browser
   * @return {String} A user friendly name for the browser
   */
  getPrettyName() {
    return this._config._prettyName;
  }

  /**
   * The selenium options passed to webdriver's `Builder` method. This
   * will have the executable path set for the browser so you should
   * manipulate these options rather than create entirely new objects.
   *
   * @return {SeleniumOptions} An instance of either
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  getSeleniumOptions() {
    return this._config._options;
  }

  /**
   * If changes are made to the selenium options, call this method to
   * set them before calling {@link getSeleniumDriver}.
   * @param {SeleniumOptions} options An instance of
   * `selenium-webdriver/firefox` or `selenium-webdriver/chrome`
   */
  setSeleniumOptions(options) {
    this._config._options = options;
  }
}

module.exports = Browser;
