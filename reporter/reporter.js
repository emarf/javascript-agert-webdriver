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
    this.currentTestId;
    this.logs = [];
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
      testLabels: '',
    };
    this.additionalOptions = {
      runArtifacts: '',
      testArtifacts: '',
      testrailConfig: '',
      xrayConfig: '',
      zephyrConfig: '',
      runLabels: '',
    }
    this.promiseFinish = [];
    this.registerServicesListeners();
    this.tests;
    this.allTests = [];
    this.isRevert = false;
    this.revertTests = [];
  }

  registerServicesListeners() {
    process.on("SET_MAINTAINER", this.setMaintainer.bind(this));
    process.on("SET_RUN_ARTIFACTS", this.setRunArtifactsAttachments.bind(this));
    process.on("SET_TEST_ARTIFACTS", this.setTestArtifactAttachments.bind(this));
    process.on("SET_TESTRAIL_CONFIG", this.setTestrailConfig.bind(this));
    process.on("SET_XRAY_CONFIG", this.setXrayConfig.bind(this));
    process.on("SET_ZEPHYR_CONFIG", this.setZephyrConfig.bind(this));
    process.on("SET_RUN_LABELS", this.setRunLabels.bind(this));
    process.on("SET_TEST_LABELS", this.setTestLabels.bind(this));
    process.on("SET_TEST_LOGS", this.setTestLogs.bind(this));
    process.on("REVERT_TEST_REGISTRATION", this.revertTestRegistration.bind(this));
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
    setTimeout(() => {
      this.startTestAndSession(testStats);
    }, 100)
  };

  onTestPass(testStats) {
    console.log('onTestPass');
    this.promiseFinish.push(this.zebrunnerApiClient.finishTestSession(testStats));
    this.promiseFinish.push(this.zebrunnerApiClient.finishTest(testStats));
  };

  onTestFail(testStats) {
    console.log('onTestFail');
    // this.saveAndSendFailedScreenshot(this.currentTestId, testStats);
    this.promiseFinish.push(this.zebrunnerApiClient.finishTestSession(testStats));
    this.promiseFinish.push(this.zebrunnerApiClient.finishTest(testStats));
  };

  onSuiteEnd(testStats) {
    console.log('onSuiteEnd');
    const arraysOfLogs = this.allTests.map((testId, index) => this.createLogs(testId, testStats.tests[index]));
    this.logs.push(arraysOfLogs);
    const testsLogs = this.logs.flat(2);
    this.zebrunnerApiClient.sendLogs(testsLogs);
    this.tests = testStats.tests;
  }

  async onRunnerEnd(runStats) {
    console.log('onRunnerEnd');
    try {
      await Promise.all(this.promiseFinish).then(async () => {
        let isReadyToFinish = true;
        await this.sendRunAttachments();

        this.tests.forEach((test, index) => {
          this.zebrunnerApiClient.sendTestVideo(test);
          this.zebrunnerApiClient.sendScreenshots(test, this.allTests[index])
        });

        const response = await this.zebrunnerApiClient.searchTests();
        response.data.results.forEach((el) => {
          if (el.status === 'IN_PROGRESS') {
            isReadyToFinish = false;
          };
        });

        this.revertTests.forEach((testId) => this.zebrunnerApiClient.revertTestRegistration(testId));

        if (isReadyToFinish) {
          await this.zebrunnerApiClient.registerTestRunFinish(runStats);
        }
      })
    } catch (e) {
      console.log(e);
    } finally {
      this.isSynchronised = true
    }
  };

  async sendRunAttachments() {
    await Promise.all([
      this.zebrunnerApiClient.sendRunArtifacts(this.additionalOptions),
      this.zebrunnerApiClient.sendRunArtifactReferences(this.additionalOptions),
      this.zebrunnerApiClient.sendRunLabels(this.additionalOptions),
    ])
  }

  onAfterCommand(command) {
    try {
      // const hasScreenshot = /screenshot$/.test(command.endpoint) && !!command.result.value;
      // if (hasScreenshot) {
      //   this.zebrunnerApiClient.sendScreenshot(this.currentTestId, command.result.value, Date.now());
      //   return;
      // }
    } catch (e) {
      console.log(e);
    }
  }

  startTestAndSession(testStats) {
    this.runId.then(() => {
      try {
        Promise.all([
          this.zebrunnerApiClient.startTest(testStats, this.testAdditionalLabels),
          this.zebrunnerApiClient.startTestSession(testStats, this.browserCapabilities),
        ]).then((res) => {
          if (this.isRevert) {
            this.revertTests.push(res[0]);
            this.isRevert = false;
          }
          this.allTests.push(res[0])
          this.currentTestId = res[0];
          this.sendTestArtifacts(this.additionalOptions, this.currentTestId);
        })
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
      testLabels: '',
    };
  }

  // saveAndSendFailedScreenshot(testId, testStats) {
  //   const fileName = `${testStats.fullTitle}${testStats.state}.png`;
  //   if (!fs.existsSync(path.join(__dirname, 'failedScreenshotFolder'))) {
  //     fs.mkdirSync(path.join(__dirname, '/failedScreenshotFolder'));
  //   }
  //   const filePath = path.join(__dirname, `/failedScreenshotFolder/${fileName}`);
  //   browser.saveScreenshot(filePath);
  //   const img = fs.readFileSync(filePath);
  //   this.zebrunnerApiClient.sendScreenshot(testId, img, Date.now() - 2).then(() => {
  //     fs.rmSync(filePath);
  //   });
  // }

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
    console.log(xrayConfig);
    this.additionalOptions.xrayConfig = xrayConfig;
    this.testAdditionalLabels.xrayConfig.testKey = xrayConfig.testKey;
  }

  setZephyrConfig(zephyrConfig) {
    console.log('zephyr config');
    this.additionalOptions.zephyrConfig = zephyrConfig;
    this.testAdditionalLabels.zephyrConfig.testCaseKey = zephyrConfig.testCaseKey;
  }

  setRunLabels(labels) {
    console.log('run labels');
    this.additionalOptions.runLabels = labels;
  }

  setTestLabels(labels) {
    console.log('test labels');
    this.testAdditionalLabels.testLabels = labels;
  }

  setTestLogs(logs) {
    console.log('test logs');
    const testId = this.currentTestId;
    const logsWithId = logs.map((log) => ({ ...log, testId }));
    this.logs.push(logsWithId);
  }

  revertTestRegistration() {
    console.log('revert test');
    this.isRevert = true;
  }

  createLogs(testId, testStats) {
    const logsForTest = [];
    if (testStats.start) {
      logsForTest.push({
        testId: testId,
        level: 'INFO',
        message: `TEST ${testStats.fullTitle} STARTED at ${parseDate(testStats.start)}`,
        timestamp: `${testStats.start.getTime()}`,
      })
    }
    if (testStats.end) {
      logsForTest.push({
        testId: testId,
        level: 'INFO',
        message: `TEST ${testStats.fullTitle} ${testStats.state.toUpperCase()} at ${parseDate(testStats.end)}`,
        timestamp: `${testStats.end.getTime() + 1}`,
      })
    }

    let number = 1;
    const filterLogs = testStats.output.filter((el) => el.type === 'result');
    filterLogs.forEach((item) => {
      if (item.endpoint === '/session/:sessionId/screenshot') {
        return;
      }
      if (item.result.value === null && Object.keys(item.body).length > 0) {
        if (logsForTest.some((log) => log.message === item.body.url)) {
          return;
        }
        logsForTest.push({
          testId: testId,
          level: 'TRACE',
          message: `${item.body.url || item.body.text || item.body.value}`,
          timestamp: `${testStats.start.getTime() + number}`,
        })
      }
      if (typeof item.result.value === 'string') {
        if (logsForTest.some((log) => log.message === item.result.value)) {
          return;
        }
        logsForTest.push({
          testId: testId,
          level: 'TRACE',
          message: `${item.result.value}`,
          timestamp: `${testStats.start.getTime() + number}`,
        })
      }
      number += 1;
    });

    if (testStats.errors) {
      logsForTest.push({
        testId: testId,
        level: 'ERROR',
        message: `${testStats.errors[0].message}`,
        timestamp: `${testStats.end.getTime() - 1}`,
      });
    }

    return logsForTest;
  }
};