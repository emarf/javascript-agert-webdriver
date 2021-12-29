import WDIOReporter from '@wdio/reporter'
import ZebrunnerApiClient from './zebr-api-client';
import { parseDate, getBrowserCapabilities } from './utils';
const path = require('path');
const fs = require('fs')

export default class ZebrunnerReporter extends WDIOReporter {
  constructor(reporterConfig) {
    super(reporterConfig);
    this.reporterConfig = { reporterOptions: this.options };
    this.zebrunnerApiClient = new ZebrunnerApiClient(this.reporterConfig);
    this.browserCapabilities;
    this.syncReporting = false;
    this.runId;
    this.testLogs = [];
    this.logDate;
    this.testId;
    // options that can change every run
    this.testAdditionalLabels = {
      maintainer: '',
      testrailConfig: {
        caseId: '',
      },
      xrayConfig: {
        testKey: '',
      },
      zephyrConfig: {
        testCaseKey: '',
      },
    };
    this.additionalOptions = {
      runArtifacts: '',
      testArtifacts: '',
      testrailConfig: '',
      xrayConfig: '',
      zephyrConfig: '',
    }
    this.promiseFinish = [];
    this.test();
  }

  test() {
    process.on("SET_MAINTAINER", this.setMaintainer.bind(this));
    process.on("SET_RUN_ARTIFACTS", this.setRunArtifactsAttachments.bind(this));
    process.on("SET_TEST_ARTIFACTS", this.setTestArtifactAttachments.bind(this));
    process.on("SET_TESTRAIL_CONFIG", this.setTestrailConfig.bind(this));
    process.on("SET_XRAY_CONFIG", this.setXrayConfig.bind(this));
    process.on("SET_ZEPHYR_CONFIG", this.setZephyrConfig.bind(this));
  }

  get isSynchronised() {
    return this.syncReporting;
  }

  set isSynchronised(val) {
    this.syncReporting = val;
  }

  onRunnerStart(runStats) {
    console.log('onRunnerStart');
    this.browserCapabilities = getBrowserCapabilities(runStats);
  }

  onSuiteStart(suiteStats) {
    console.log('onSuiteStart');
    this.runId = this.zebrunnerApiClient.registerTestRunStart(suiteStats);
  }

  onTestStart(testStats) {
    console.log('onTestStart');
    this.createLog(testStats, 'start');
    setTimeout(() => {
      this.startTestAndSession(testStats);
    }, 100)
  };

  onTestPass(testStats) {
    console.log('onTestPass');
    this.createLog(testStats, 'end');
    this.promiseFinish.push(this.addTestIdForTestLogs());
    this.promiseFinish.push(this.zebrunnerApiClient.finishTestSession(testStats));
    this.promiseFinish.push(this.zebrunnerApiClient.finishTest(testStats));
  };

  onTestFail(testStats) {
    console.log('onTestFail');
    this.saveAndSendFailedScreenshot(testStats)
    this.createLog(testStats, 'fail');
    this.createLog(testStats, 'end');
    this.promiseFinish.push(this.addTestIdForTestLogs());
    this.promiseFinish.push(this.zebrunnerApiClient.finishTestSession(testStats));
    this.promiseFinish.push(this.zebrunnerApiClient.finishTest(testStats));
  };

  onSuiteEnd(testStats) {
    console.log('onSuiteEnd')
  }

  async onRunnerEnd(runStats) {
    console.log('onRunnerEnd');
    try {
      await Promise.all(this.promiseFinish).then(async () => {
        let isReadyToFinish = true;
        this.zebrunnerApiClient.sendRunArtifacts(this.additionalOptions);
        this.zebrunnerApiClient.sendRunArtifactReferences(this.additionalOptions);
        this.zebrunnerApiClient.sendLogs(runStats, this.testLogs);
        this.zebrunnerApiClient.sendRunLabels(this.additionalOptions);
        const response = await this.zebrunnerApiClient.searchTests();
        response.data.results.forEach((el) => {
          if (el.status === 'IN_PROGRESS') {
            isReadyToFinish = false;
          };
        });

        if (isReadyToFinish) {
          await this.zebrunnerApiClient.registerTestRunFinish(runStats);
        } else {
          return new Promise(resolve => resolve());
        }
      })
    } catch (e) {
      console.log(e);
    } finally {
      this.isSynchronised = true
    }
  };

  onAfterCommand(command) {
    const methods = ['POST', "GET"];
    try {
      if (this.isRetry !== command.endpoint && methods.includes(command.method)) {
        const hasScreenshot = /screenshot$/.test(command.endpoint) && !!command.result.value;
        if (hasScreenshot) {
          this.zebrunnerApiClient.sendScreenshot(this.testId, command, command.result.value, Date.now());
          return;
        }
        const logInfo = command.body.url || command.body.text || command.body.value || command.result.value;
        this.createLog(logInfo, 'log');
      }
      this.isRetry = command.endpoint;
    } catch (e) {
      console.log(e);
    }
  }

  createLog(testStats, status) {
    let testLog;
    this.logDate = Date.now();

    switch (status) {
      case "start": {
        testLog = {
          level: 'INFO',
          message: `TEST ${testStats.fullTitle} STARTED at ${parseDate(testStats.start)}`,
          timestamp: `${testStats.start.getTime()}`,
        };
        break;
      };
      case 'end': {
        testLog = {
          level: 'INFO',
          message: `TEST ${testStats.fullTitle} ${testStats.state.toUpperCase()} at ${parseDate(testStats.end)}`,
          timestamp: `${testStats.end.getTime() + 1}`,
        };
        break;
      };
      case 'fail': {
        testLog = {
          level: 'ERROR',
          message: `Error ${testStats.errors[0].message} at ${parseDate(testStats.end)}`,
          timestamp: `${testStats.end.getTime()}`,
        };
        break;
      };
      default: {
        testLog = {
          level: !testStats ? 'WARN' : 'TRACE',
          message: `${testStats} at ${parseDate(new Date)}`,
          timestamp: `${this.logDate}`,
        };
        break;
      };
    };
    this.testLogs.push(testLog);
  };

  addTestIdForTestLogs() {
    this.testLogs.forEach((el) => {
      if (!el.testId) {
        return el.testId = this.testId;
      }
      return el;
    });
  }

  startTestAndSession(testStats) {
    this.runId.then(() => {
      try {
        Promise.all([
          this.zebrunnerApiClient.startTest(testStats, this.testAdditionalLabels),
          this.zebrunnerApiClient.startTestSession(testStats, this.browserCapabilities),
        ]).then((res) => {
          this.testId = res[0];
          this.sendTestArtifacts(this.additionalOptions, this.testId);
        });
      } catch (e) {
        console.log(e);
      }
    });
  }

  sendTestArtifacts(options, testId) {
    this.zebrunnerApiClient.sendTestArtifacts(options, testId);
    this.zebrunnerApiClient.sendTestArtifactReferences(options, testId);
    this.testAdditionalLabels = {
      maintainer: '',
      testrailConfig: {
        caseId: '',
      },
      xrayConfig: {
        testKey: '',
      },
      zephyrConfig: {
        testCaseKey: '',
      },
    };
  }

  saveAndSendFailedScreenshot(testStats) {
    const fileName = `${testStats.fullTitle}${testStats.state}.png`;
    const filePath = path.join(`${__dirname}/failedScreenshotFolder`, fileName);
    browser.saveScreenshot(filePath);
    const parseImage = fs.readFileSync(filePath);
    this.zebrunnerApiClient.sendScreenshot(this.testId, testStats, parseImage, Date.now() - 1);
  }

  setMaintainer(maintainer) {
    console.log('maintainer');
    this.testAdditionalLabels.maintainer = maintainer;
  }

  setRunArtifactsAttachments(artifacts) {
    console.log('run artifacts');
    this.additionalOptions.runArtifacts = artifacts;
  }

  setTestArtifactAttachments(artifacts) {
    console.log('test artifacts');
    this.additionalOptions.testArtifacts = artifacts;
  }

  setTestrailConfig(testrailConfig) {
    console.log('testrail config');
    this.additionalOptions.testrailConfig = testrailConfig;
    this.testAdditionalLabels.testrailConfig.caseId = testrailConfig.caseId;
  }

  setXrayConfig(xrayConfig) {
    console.log('xray config');
    this.additionalOptions.xrayConfig = xrayConfig;
    this.testAdditionalLabels.xrayConfig.testKey = xrayConfig.testKey;
  }

  setZephyrConfig(zephyrConfig) {
    console.log('zephyr config');
    this.additionalOptions.zephyrConfig = zephyrConfig;
    this.testAdditionalLabels.zephyrConfig.testCaseKey = zephyrConfig.testCaseKey;
  }
};