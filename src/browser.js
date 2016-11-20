class Browser {
  constructor(config) {
    this._id = config._id;
    this._seleniumOptions = config._options;
    this._driverModule = config._driverModule;
  }

  getId() {
    return this._id;
  }

  getDriverModule() {
    return this._driverModule;
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
    return this._seleniumOptions;
  }
}

module.exports = Browser;
