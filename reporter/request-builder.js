import { v4 as uuidv4 } from 'uuid';
import ConfigResolver from './config-resolver';


const getRefreshToken = (token) => {
  return {
    refreshToken: token
  };
};

const getTestRunStart = (suite, reporterConfig) => {
  let testRunStartBody = {
    uuid: uuidv4(),
    name: suite.title,
    startedAt: suite.start,
    framework: 'wdio',
    config: {},
    notificationTargets: []
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

const getTestStart = (test, maintainer) => {
  let testStartBody = {
    'name': test.title,
    'startedAt': test.start,
    'className': test.fullTitle,
    'maintainer': maintainer ? maintainer : 'anonymous',
    'methodName': test.title,
  };

  return testStartBody;
};

const getTestEnd = (test) => {
  return {
    'endedAt': test.end,
    'result': test.state.toUpperCase(),
  };
};

const getTestSessionStart = (testStats, testId, capabilities) => {
  return {
    'sessionId': uuidv4(),
    'initiatedAt': testStats.start,
    'startedAt': testStats.start,
    'capabilities': capabilities ? capabilities : 'n/a',
    'desiredCapabilities': capabilities ? capabilities : 'n/a',
    'testIds': [testId]
  };
};

const getTestSessionEnd = (testStats, testId) => {
  return {
    'endedAt': testStats.end,
    'testIds': [testId]
  };
};

const getTestRunLabels = (reporterOptions, options) => {
  const testRunLabelsBody = {
    items: []
  };

  if (reporterOptions.reportingRunLocale) {
    testRunLabelsBody.items.push({ 'key': 'com.zebrunner.app/sut.locale', 'value': reporterOptions.reportingRunLocale })
  }

  if (options.tcmConfig) {
    Object.keys(options.tcmConfig).forEach((el) => {;
      Object.keys(options.tcmConfig[el]).forEach((key) => {
        testRunLabelsBody.items.push(options.tcmConfig[el][key])
      })
    })
  }

  if (options.labels.length > 0) {
    options.labels.forEach((el) => {
      testRunLabelsBody.items.push(el);
    })
  }

  return testRunLabelsBody;
};

const getTestLabels = (options) => {
  const obj = {
    items: [],
  }

  if (options.testTcmOptions.length > 0) {
    options.testTcmOptions.forEach((tcmOptions) => {
      obj.items.push(tcmOptions);
    })
  }

  if (options.labels.length > 0) {
    options.labels.forEach((tcmOptions) => {
      obj.items.push(tcmOptions);
    })
  }

  return obj;
}
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
  getTestLabels,
  getTestsSearch,
}