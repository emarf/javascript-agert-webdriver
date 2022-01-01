import Artifacts from "../../reporter/services/artifacts";
import Labels from "../../reporter/services/labels";
import Testrail from "../../reporter/services/testrail";
import Xray from "../../reporter/services/xray";
import Zephyr from "../../reporter/services/zephyr";
import { ZebrunnerApi } from '../../reporter/zebrunnerApi';

const artifacts = new Artifacts();
const testrail = new Testrail();
const xray = new Xray();
const zephyr = new Zephyr();
const label = new Labels();

describe('Ebay Product Search', () => {
  artifacts.attachToTestRun(['runEBAY.txt', '/artifactsFiles']);
  artifacts.attachReferenceToTestRun(['EBAY1runref1', 'https://google.com'])
  artifacts.attachReferenceToTestRun(['EBAY2runref2', 'https://zebrunner.com'])
  ZebrunnerApi.setRunArtifactAttachments(artifacts.getRunAttachments());

  label.setRunLabel(['Author', 'Roman']);
  ZebrunnerApi.setRunLabels(label.getRunLabels());

  before(() => {
    testrail.setSuiteId('EBAYtestrailsuiteId1');
    testrail.setAssignee('EBAYJohntestrailassignee1');
    testrail.setMilestone('EBAYtestrailmilestone1');
    testrail.setRunName('EBAYMarktesttrailrunName1');
    testrail.setRunId('EBAY123testrailrunId1');
    xray.setExecutionKey('EBAYZBR-42xrayexecutionKey1');
    zephyr.setTestCycleKey('EBAYzephyrcycleKey1');
    zephyr.setJiraProjectKey('EBAYzephyrjiraKey1');
  })

  it('should open the main url and verify title', async () => {
    artifacts.attachToTest(['testEBAY1.txt', '/artifactsFiles'])
    artifacts.attachToTest(['testEBAY3.txt', '/artifactsFiles'])
    artifacts.attachReferenceToTest(['EBAYtestref1', 'https://github.com']);
    artifacts.attachReferenceToTest(['EBAYtestref2', 'https://www.youtube.com']);
    ZebrunnerApi.setTestArtifactAttachments(artifacts.getTestAttachments());

    ZebrunnerApi.setMaintainer('emarf');

    testrail.setCaseId(['EBAYtestrail1', 'EBAYtestrail2']);
    ZebrunnerApi.setTestrailConfig(testrail.getTestrailConfig());

    xray.setTestKey(['EBAYxray1', 'EBAYxray2']);
    ZebrunnerApi.setXrayConfig(xray.getXrayConfig());

    zephyr.setTestCaseKey(['EBAYzephyr1', 'EBAYzephyr2']);
    ZebrunnerApi.setZephyrConfig(zephyr.getZephyrConfig());

    label.setTestLabel(['ForTest', 'Ebay test 1']);
    ZebrunnerApi.setTestLabels(label.getTestLabels());

    await browser.url(`https://www.ebay.com`);
    await expect(browser).toHaveTitle('Электроника, автомобили, мода, коллекционирование, купоны и другие товары | eBay');
  });

  it('should add value to input and click', async () => {
    artifacts.attachToTest(['testEBAY2.txt', '/artifactsFiles']);
    artifacts.attachReferenceToTest(['EBAYtestref3', 'https://github.com']);
    artifacts.attachReferenceToTest(['EBAYtestref4', 'https://www.youtube.com']);
    ZebrunnerApi.setTestArtifactAttachments(artifacts.getTestAttachments());

    ZebrunnerApi.setMaintainer('emarf');

    testrail.setCaseId(['EBAYtestrail3', 'EBAYtestrail4']);
    ZebrunnerApi.setTestrailConfig(testrail.getTestrailConfig());

    xray.setTestKey(['EBAYxray3', 'EBAYxray4']);
    ZebrunnerApi.setXrayConfig(xray.getXrayConfig());

    zephyr.setTestCaseKey(['EBAYzephyr3', 'EBAYzephyr4']);
    ZebrunnerApi.setZephyrConfig(zephyr.getZephyrConfig());

    label.setTestLabel(['ForTest', 'Ebay test 2']);
    ZebrunnerApi.setTestLabels(label.getTestLabels());

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.addValue('Laptop');
    await searchBtn.click();

    await expect(searchInput).toHaveValue('laptop');

    await expect(browser).toHaveTitle('laptop | eBay');
  });
})

