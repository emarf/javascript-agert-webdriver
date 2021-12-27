import Artifacts from "../../reporter/services/artifacts";
import Testrail from "../../reporter/services/testrail";
import Xray from "../../reporter/services/xray";
import Zephyr from "../../reporter/services/zephyr";
import {ZebrunnerApi} from '../../reporter/zebrunnerApi';

const artifacts = new Artifacts();
const testrail = new Testrail();
const xray = new Xray();
const zephyr = new Zephyr();

describe('Webdriverio main page', () => {
  artifacts.attachToTestRun('run.txt', '/artifactsFiles');
  artifacts.attachReferenceToTestRun('attach for run', 'https://google.com');
  ZebrunnerApi.setRunArtifactAttachments(artifacts.getRunAttachments());

  before(() => {
    testrail.setSuiteId('321testrail');
    testrail.setAssignee('John testrail');
    testrail.setMilestone('testrail milestone');
    testrail.setRunName('testRail run name');
    testrail.setRunId('123 testrail');
    xray.setExecutionKey('ZBR-42 xray');
    zephyr.setTestCycleKey('zephyr cycle key');
    zephyr.setJiraProjectKey('zephyr jira key');
  })

  it('should be right title', async () => {
    artifacts.attachToTest('test.txt', '/artifactsFiles');
    artifacts.attachReferenceToTest('attach for run', 'https://github.com');
    ZebrunnerApi.setTestArtifactAttachments(artifacts.getTestAttachments());

    ZebrunnerApi.setMaintainer('emarf');

    testrail.setCaseId(['testrail', 'testrail1']);
    ZebrunnerApi.setTestrailConfig(testrail.getTestrailConfig());

    xray.setTestKey(['xray', 'xray1']);
    ZebrunnerApi.setXrayConfig(xray.getXrayConfig());

    zephyr.setTestCaseKey(['zephyr', 'zephyr1']);
    ZebrunnerApi.setZephyrConfig(zephyr.getZephyrConfig());

    await browser.url(`https://webdriver.io`);
    await browser.takeScreenshot();
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO');
  });
});
