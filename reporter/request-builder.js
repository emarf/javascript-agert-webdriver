import { v4 as uuidv4 } from 'uuid';
import ConfigResolver from './config-resolver';
import { testrailLabels, xrayLabels, zephyrLabels } from './constants';

const getRefreshToken = (token) => {
  return {
    refreshToken: token
  };
};

const getTestRunStart = (suite, reporterConfig) => {
  let testRunStartBody = {
    'uuid': uuidv4(),
    'name': suite.title,
    'startedAt': suite.start,
    'framework': 'wdio',
    'config': {},
    'notificationTargets': []
  };
  let configResolver = new ConfigResolver(reporterConfig)

  if (configResolver.getReportingRunEnvironment()) {
    testRunStartBody.config.environment = configResolver.getReportingRunEnvironment()
  }
  if (configResolver.getReportingRunBuild()) {
    testRunStartBody.config.build = configResolver.getReportingRunBuild()
  }
  if (configResolver.getReportingRunDisplayName()) {
    testRunStartBody.name = configResolver.getReportingRunDisplayName()
  }
  if (configResolver.getReportingCiRunId()) {
    testRunStartBody.uuid = configResolver.getReportingCiRunId()
  }
  if (configResolver.getSlackChannels()) {
    testRunStartBody.notificationTargets.push({ 'type': 'SLACK_CHANNELS', 'value': configResolver.getSlackChannels() })
  }
  if (configResolver.getEmailRecipients()) {
    testRunStartBody.notificationTargets.push({ 'type': 'EMAIL_RECIPIENTS', 'value': configResolver.getEmailRecipients() })
  }

  return testRunStartBody;
};

const getTestRunEnd = (test) => {
  return {
    'endedAt': test.end,
  };
};

const getTestStart = (test, additionOptions) => {
  let testStartBody = {
    'name': test.title,
    'startedAt': test.start,
    'className': test.fullTitle,
    'methodName': test.title,
    'labels': []
  };

  if (additionOptions.maintainer) {
    console.debug(`Test owner ${additionOptions.maintainer} was set for the test "${test.title}"`);
    testStartBody.maintainer = additionOptions.maintainer;
  }
  if (additionOptions.testrailConfig.caseId) {
    additionOptions.testrailConfig.caseId.value.forEach((testrailId) => {
      testStartBody.labels.push({ key: additionOptions.testrailConfig.caseId.key, value: testrailId });
    })
  }
  if (additionOptions.xrayConfig.testKey) {
    additionOptions.xrayConfig.testKey.value.forEach((xrayId) => {
      testStartBody.labels.push({ key: additionOptions.xrayConfig.testKey.key, value: xrayId });
    })
  }
  if (additionOptions.zephyrConfig.testCaseKey) {
    additionOptions.zephyrConfig.testCaseKey.value.forEach((zephyrId) => {
      testStartBody.labels.push({ key: additionOptions.zephyrConfig.testCaseKey.key, value: zephyrId });
    })
  }
  return testStartBody;
};

const getTestEnd = (test) => {
  return {
    'endedAt': test.end,
    'result': test.state.toUpperCase(),
  };
};

const getTestSessionStart = (testStats, zbrTestId, capabilities) => {
  return {
    'sessionId': uuidv4(),
    'initiatedAt': testStats.start,
    'startedAt': testStats.start,
    'capabilities': capabilities ? capabilities : 'n/a',
    'desiredCapabilities': capabilities ? capabilities : 'n/a',
    'testIds': [zbrTestId]
  };
};

const getTestSessionEnd = (testStats, zbrTestId) => {
  return {
    'endedAt': testStats.end,
    'testIds': [zbrTestId]
  };
};

const getTestRunLabels = (reporterOptions, additionalOptions) => {
  var testRunLabelsBody = {
    'items': []
  };
  if (reporterOptions.reportingRunLocale) {
    testRunLabelsBody.items.push({ 'key': 'com.zebrunner.app/sut.locale', 'value': reporterOptions.reportingRunLocale })
  }

  if (additionalOptions.testrailConfig.enableSync.value === 'true') {
    Object.keys(additionalOptions.testrailConfig).forEach((item) => {
      if (additionalOptions.testrailConfig[item].key !== testrailLabels.CASE_ID && additionalOptions.testrailConfig[item].value) {
        testRunLabelsBody.items.push(additionalOptions.testrailConfig[item])
      }
    })
  }
  if (additionalOptions.xrayConfig.enableSync.value === 'true') {
    Object.keys(additionalOptions.xrayConfig).forEach((item) => {
      if (additionalOptions.xrayConfig[item].key !== xrayLabels.TEST_KEY && additionalOptions.xrayConfig[item].value) {
        testRunLabelsBody.items.push(additionalOptions.xrayConfig[item])
      }
    })
  }
  if (additionalOptions.zephyrConfig.enableSync.value === 'true') {
    Object.keys(additionalOptions.zephyrConfig).forEach((item) => {
      if (additionalOptions.zephyrConfig[item].key !== zephyrLabels.TEST_CASE_KEY && additionalOptions.zephyrConfig[item].value) {
        testRunLabelsBody.items.push(additionalOptions.zephyrConfig[item])
      }
    })
  }
  return testRunLabelsBody;
};

const getTestsSearch = (testRunId) => {
  return {
    'page': 1,
    'pageSize': 100000,
    'testRunId': testRunId
  }
};

module.exports = {
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
  getTestSessionStart,
  getTestSessionEnd,
  getTestRunLabels,
  getTestsSearch
}