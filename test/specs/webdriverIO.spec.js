import { reporterEmitter } from '../../src/reporterEmitter';

describe('Webdriverio main page', () => {

  before(() => {
    const tcmRunOptions = [
      {
        xrayExecutionKey: 'execKey',
        // xrayDisableSync: true,
        // xrayEnableRealTimeSync: true
      },
      {
        testRailSuiteId: 'testRailSuite',
        // testRailRunId: '322',
        // testRailRunName: 'testRailName',
        // testRailMilestone: 'milestone',
        // testRailAssignee: 'emarf',
        // testRailDisableSync: true,
        // testRailIncludeAll: true,
        // testRailEnableRealTimeSync: true,
      },
      {
        zephyrTestCycleKey: 'zephyr123',
        zephyrJiraProjectKey: 'zephyr321',
        // zephyrDisableSync: true,
        // zephyrEnableRealTimeSync: true,
      } 
    ]

    reporterEmitter.setRunTcmOptions(tcmRunOptions);
    reporterEmitter.setRunLabels({
      Chrome: "87.0",
      version: 'test1',
    })
  })

  it('should be right title', async () => {
    const tcmTestOptions = [
      {
        xrayTestKey: ['testKey', 'testKey1'],
      },
      {
        testRailCaseId: ['caseId', 'caseId1'],
      },
      {
        zephyrTestCaseKey: ['zephyr', 'zephyr1'],
      },
    ];
    reporterEmitter.setMaintainer('emarf');
    reporterEmitter.setTestTcmOptions(tcmTestOptions);
    reporterEmitter.setTestLabels({
      Author: 'dimple',
    });

    await browser.url(`https://webdriver.io`);
    await browser.takeScreenshot();
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO');
  });
});
