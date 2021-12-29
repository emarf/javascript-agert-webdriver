import { v4 as uuidv4 } from 'uuid';
import ConfigResolver from './config-resolver';
import { testrailLabels, xrayLabels, zephyrLabels } from './constants';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';


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

const getTestStart = (test, additionalLabels) => {
  let testStartBody = {
    'name': test.title,
    'startedAt': test.start,
    'className': test.fullTitle,
    'methodName': test.title,
    'labels': []
  };

  if (additionalLabels.maintainer) {
    console.debug(`Test owner ${additionalLabels.maintainer} was set for the test "${test.title}"`);
    testStartBody.maintainer = additionalLabels.maintainer;
  }
  if (additionalLabels.testrailConfig.caseId) {
    additionalLabels.testrailConfig.caseId.value.forEach((testrailId) => {
      testStartBody.labels.push({ key: additionalLabels.testrailConfig.caseId.key, value: testrailId });
    })
  }
  if (additionalLabels.xrayConfig.testKey) {
    additionalLabels.xrayConfig.testKey.value.forEach((xrayId) => {
      testStartBody.labels.push({ key: additionalLabels.xrayConfig.testKey.key, value: xrayId });
    })
  }
  if (additionalLabels.zephyrConfig.testCaseKey) {
    additionalLabels.zephyrConfig.testCaseKey.value.forEach((zephyrId) => {
      testStartBody.labels.push({ key: additionalLabels.zephyrConfig.testCaseKey.key, value: zephyrId });
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
  let testRunLabelsBody = {
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

const getTestArtifacts = (attach) => {
  const array = attach.reduce((acc, el) => [...acc, { fileName: el[0], filePath: el[1] }], []);
  return array.map((item) => {
    const filePath = path.join(__dirname, item.filePath, item.fileName);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    return formData;
  });
}

const getArtifactReferences = (references) => {
  const array = references.reduce((acc, el) => [...acc, { name: el[0], value: el[1] }], []);
  return { items: array };
}

module.exports = {
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
  getTestSessionStart,
  getTestSessionEnd,
  getTestRunLabels,
  getTestsSearch,
  getTestArtifacts,
  getArtifactReferences,
}