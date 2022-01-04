// import Artifacts from '../../reporter/services/artifacts';
// import Labels from '../../reporter/services/labels';
// import Logger from '../../reporter/services/logger';
// import Testrail from '../../reporter/services/testrail';
// import Xray from '../../reporter/services/xray';
// import Zephyr from '../../reporter/services/zephyr';
import { reporterEmitter } from '../../reporter/reporterEmitter';

// const artifacts = new Artifacts();
// const testrail = new Testrail();
// const xray = new Xray();
// const zephyr = new Zephyr();
// const label = new Labels();
// const logger = new Logger();

describe('Ebay Product Search', () => {
  // artifacts.attachToTestRun(['runEBAY.txt', '/artifactsFiles']);
  // artifacts.attachReferenceToTestRun(['EBAY1runref1', 'https://google.com'])
  // artifacts.attachReferenceToTestRun(['EBAY2runref2', 'https://zebrunner.com'])
  // reporterEmitter.setRunArtifactAttachments(artifacts.getRunAttachments());

  // label.setRunLabel(['TEST', 'Roman']);
  // reporterEmitter.setRunLabels(label.getRunLabels());

  before(() => {
    // testrail.setSuiteId('EBAYtestrailsuiteId1');
    // testrail.setAssignee('EBAYJohntestrailassignee1');
    // testrail.setMilestone('EBAYtestrailmilestone1');
    // testrail.setRunName('EBAYMarktesttrailrunName1');
    // testrail.setRunId('EBAY123testrailrunId1');
    // xray.setExecutionKey('EBAYZBR-42xrayexecutionKey1');
    // zephyr.setTestCycleKey('EBAYzephyrcycleKey1');
    // zephyr.setJiraProjectKey('EBAYzephyrjiraKey1');
  })

  it('should verify title search laptop and verify title', async () => {
    reporterEmitter.revertTestRegistration();

    // artifacts.attachToTest(['testEBAY1.txt', '/artifactsFiles'])
    // artifacts.attachToTest(['testEBAY3.txt', '/artifactsFiles'])
    // artifacts.attachReferenceToTest(['EBAYtestref1', 'https://github.com']);
    // artifacts.attachReferenceToTest(['EBAYtestref2', 'https://www.youtube.com']);
    // reporterEmitter.setTestArtifactAttachments(artifacts.getTestAttachments());

    reporterEmitter.setMaintainer('emarf');

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
  
    await expect(browser).toHaveTitle('Электроник, автомобили, мода, коллекционирование, купоны и другие товары | eBay');

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

    reporterEmitter.setMaintainer('emarf');

    // testrail.setCaseId(['EBAYtestrail3', 'EBAYtestrail4']);
    // reporterEmitter.setTestrailConfig(testrail.getTestrailConfig());

    // xray.setTestKey(['EBAYxray3', 'EBAYxray4']);
    // reporterEmitter.setXrayConfig(xray.getXrayConfig());

    // zephyr.setTestCaseKey(['1', '2']);
    // reporterEmitter.setZephyrConfig(zephyr.getZephyrConfig());

    // label.setTestLabel(['ForTest', 'Ebay test 2']);
    // reporterEmitter.setTestLabels(label.getTestLabels());

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.clearValue();
    await searchInput.addValue('telephones');
    await searchBtn.click();

    await expect(searchInput).toHaveValue('telephones');

    await expect(browser).toHaveTitle('telephones | eBay');
  });
})

