export default class ZebrunnerService {
  constructor(serviceOptions, capabilities, config) {
    this.options = serviceOptions
  }

  /**
   * this browser object is passed in here for the first time
   */
  before(config, capabilities, browser) {
    browser.addCommand('setOwner', (owner) => {
      return owner;
    })
    browser.addCommand('setTestrailTestCaseId', (id) => {
      return id;
    })
    browser.addCommand('setXrayTestKey', (key) => {
      return key;
    })
  }

  after(exitCode, config, capabilities) {
    // TODO: something after all tests are run
  }

  beforeTest(test, context) {
    // TODO: something before each Mocha/Jasmine test run
  }

  afterTest(test) {
  }

  beforeScenario(test, context) {
    // TODO: something before each Cucumber scenario run
  }
}