import Artifacts from '../reporter/services/artifacts';
import Testrail from '../reporter/services/testrail';
import Xray from '../reporter/services/xray';
import Zephyr from '../reporter/services/zephyr';
import { reporterEmitter } from '../reporter/reporterEmitter';

const artifacts = new Artifacts();
const testrail = new Testrail();
const xray = new Xray();
const zephyr = new Zephyr();

describe('Webdriverio main page', () => {
  artifacts.attachToTestRun(['runWDIO.txt', '/artifactsFiles']);
  artifacts.attachReferenceToTestRun(['WDIO1runref1', 'https://google.com'])
  artifacts.attachReferenceToTestRun(['WDIO2runref2', 'https://zebrunner.com'])
  reporterEmitter.setRunArtifactAttachments(artifacts.getRunAttachments());

  before(() => {
    testrail.setSuiteId('WDIOtestrailsuiteId');
    testrail.setAssignee('WDIOJohntestrailassignee');
    testrail.setMilestone('WDIOtestrailmilestone');
    testrail.setRunName('WDIOMarktesttrailrunName');
    testrail.setRunId('WDIO123testrailrunId');
    xray.setExecutionKey('WDIOZBR-42xrayexecutionKey');
    zephyr.setTestCycleKey('WDIOzephyrcycleKey');
    zephyr.setJiraProjectKey('WDIOzephyrjiraKey');
  })

  it('should be right title', async () => {
    artifacts.attachToTest(['testWDIO.txt', '/artifactsFiles']);
    artifacts.attachReferenceToTest(['WDIOtestref1', 'https://github.com']);
    artifacts.attachReferenceToTest(['WDIOtestref2', 'https://www.youtube.com']);
    reporterEmitter.setTestArtifactAttachments(artifacts.getTestAttachments());

    reporterEmitter.setMaintainer('emarf');

    testrail.setCaseId(['WDIOtestrail', 'WDIOtestrail1']);
    reporterEmitter.setTestrailConfig(testrail.getTestrailConfig());

    xray.setTestKey(['WDIOxray', 'WDIOxray1']);
    reporterEmitter.setXrayConfig(xray.getXrayConfig());

    zephyr.setTestCaseKey(['WDIOzephyr', 'WDIOzephyr1']);
    reporterEmitter.setZephyrConfig(zephyr.getZephyrConfig());

    await browser.url(`https://webdriver.io`);
    await browser.takeScreenshot();
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO');
  });
});
