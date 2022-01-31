import { reporterEmitter } from '../../reporter/reporterEmitter';

describe('Ebay Product Search', () => {
  // artifacts.attachToTestRun(['runEBAY.txt', '/artifactsFiles']);
  // artifacts.attachReferenceToTestRun(['EBAY1runref1', 'https://google.com'])
  // artifacts.attachReferenceToTestRun(['EBAY2runref2', 'https://zebrunner.com'])
  // reporterEmitter.setRunArtifactAttachments(artifacts.getRunAttachments());

  // label.setRunLabel(['TEST', 'Roman']);
  // reporterEmitter.setRunLabels(label.getRunLabels());

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
        // zephyrTestCycleKey: 'zephyr123',
        zephyrJiraProjectKey: 'zephyr321',
        // zephyrDisableSync: true,
        // zephyrEnableRealTimeSync: true,
      } 
    ]

    reporterEmitter.setRunTcmOptions(tcmRunOptions);
    reporterEmitter.setRunLabels({
      Chrome: "85.0",
      version: 'test',
    })
    // reporterEmitter.attachToTestRun(['runEBAY.txt','runWDIO.txt'])
    // reporterEmitter.attachReferenceToTestRun([{
    //   name: 'run attach',
    //   value: 'https://www.youtube.com'
    // }])

  })

  it('should verify title search laptop and verify title', async () => {
    // reporterEmitter.revertTestRegistration();

    // artifacts.attachToTest(['testEBAY1.txt', '/artifactsFiles'])
    // artifacts.attachToTest(['testEBAY3.txt', '/artifactsFiles'])
    // artifacts.attachReferenceToTest(['EBAYtestref1', 'https://github.com']);
    // artifacts.attachReferenceToTest(['EBAYtestref2', 'https://www.youtube.com']);
    // reporterEmitter.setTestArtifactAttachments(artifacts.getTestAttachments());
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
      Author: 'Deve Loper',
    });
    
    // testrail.setCaseId(['EBAYtestrail1', 'EBAYtestrail2']);
    // reporterEmitter.setTestrailConfig(testrail.getTestrailConfig());

    // xray.setTestKey(['EBAYxray1', 'EBAYxray2']);
    // reporterEmitter.setXrayConfig(xray.getXrayConfig());

    // zephyr.setTestCaseKey(['EBAYzephyr1', 'EBAYzephyr2']);
    // reporterEmitter.setZephyrConfig(zephyr.getZephyrConfig());

    // label.setTestLabel(['ForTest', 'Ebay test 1']);
    // reporterEmitter.setTestLabels(label.getTestLabels());

    // logger.setTestLog('start');
    await browser.url(`https://www.ebay.com`);
  
    await expect(browser).toHaveTitle('Электроника, автомобили, мода, коллекционирование, купоны и другие товары | eBay');

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.addValue('laptop');
    await searchBtn.click();

    await expect(searchInput).toHaveValue('laptop');

    // logger.setTestLog('end');
    // reporterEmitter.setTestLogs(logger.getTestLogs());

    await expect(browser).toHaveTitle('laptop | eBay');

    // reporterEmitter.setTestLogs(logger.getTestLogs());
  });

  it('should search telephones and verify title', async () => {
    // artifacts.attachToTest(['testEBAY2.txt', '/artifactsFiles']);
    // artifacts.attachReferenceToTest(['EBAYtestref3', 'https://github.com']);
    // artifacts.attachReferenceToTest(['EBAYtestref4', 'https://www.youtube.com']);
    // reporterEmitter.setTestArtifactAttachments(artifacts.getTestAttachments());

    // reporterEmitter.setMaintainer('emarf');
    reporterEmitter.setTestLabels({
      Author: 'simple',
    });

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.clearValue();
    await searchInput.addValue('telephones');
    await searchBtn.click();

    await expect(searchInput).toHaveValue('telephones');

    await expect(browser).toHaveTitle('telephones | eBay');
  });
})

