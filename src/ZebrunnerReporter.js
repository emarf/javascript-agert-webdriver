import WDIOReporter from '@wdio/reporter'
import ZebrunnerApiClient from './zebr-api-client';
import { parseDate, getBrowserCapabilities, parseTcmRunOptions, parseTcmTestOptions, parseLabels, parseLogs, deleteVideoFolder, parseWdioConfig } from './utils';
import { emitterCommands } from './constants';
import RunnableStats from '@wdio/reporter/build/stats/runnable';

export default class ZebrunnerReporter extends WDIOReporter {
  constructor(reporterConfig) {
    super(reporterConfig);
    this.reporterConfig = parseWdioConfig(reporterConfig);
    console.log('reporter', this.reporterConfig);
    this.zebrunnerApiClient = new ZebrunnerApiClient(this.reporterConfig);
    this.browserCapabilities;
    this.syncReporting = false;
    this.runId;
    this.currentTestId;
    this.logs = [];
    this.runOptions = {
      tcmConfig: {},
      labels: [],
      attachments: [],
      references: [],
    }
    this.currentTestOptions = {
      maintainer: '',
      testTcmOptions: [],
      labels: [],
      attachments: [],
      references: [],
      logs: [],
    };
    this.promiseFinish = [];
    this.registerServicesListeners();
    this.arrOfTestStats;
    this.allTests = [];
    this.isRevert = false;
    this.revertTests = [];
  }

  registerServicesListeners() {
    process.on(emitterCommands.SET_MAINTAINER, this.setMaintainer.bind(this));
    process.on(emitterCommands.SET_RUN_LABELS, this.setRunLabels.bind(this));
    process.on(emitterCommands.SET_TEST_LABELS, this.setTestLabels.bind(this));
    process.on(emitterCommands.SET_RUN_TCM_OPTIONS, this.setRunTcmOptions.bind(this));
    process.on(emitterCommands.SET_TEST_TCM_OPTIONS, this.setTestTcmOptions.bind(this));
    process.on(emitterCommands.ATTACH_TO_TEST_RUN, this.attachToTestRun.bind(this));
    process.on(emitterCommands.ATTACH_REF_TO_TEST_RUN, this.attachReferenceToTestRun.bind(this));
    process.on(emitterCommands.ATTACH_TO_TEST, this.attachToTest.bind(this));
    process.on(emitterCommands.ATTACH_REF_TO_TEST, this.attachReferenceToTest.bind(this));
    // process.on(emitterCommands.SET_TEST_LOGS, this.setTestLogs.bind(this));
    process.on(emitterCommands.REVERT_TEST_REGISTRATION, this.revertTestRegistration.bind(this));
  }

  get isSynchronised() {
    return this.syncReporting;
  }

  set isSynchronised(val) {
    this.syncReporting = val;
  }

  onRunnerStart(runStats) {
    deleteVideoFolder();
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
    this.arrOfTestStats = testStats.tests;
  }

  async onRunnerEnd(runStats) {
    console.log('onRunnerEnd');
    try {
      await Promise.all(this.promiseFinish).then(async () => {
        let isReadyToFinish = true;

        await this.sendRunAttachments(this.runOptions);

        this.arrOfTestStats.forEach((test, index) => {
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

  async sendRunAttachments(options) {
    await Promise.all([
      this.zebrunnerApiClient.sendRunArtifacts(options),
      this.zebrunnerApiClient.sendRunArtifactReferences(options),
      this.zebrunnerApiClient.sendRunLabels(options),
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
          this.zebrunnerApiClient.startTest(testStats, this.currentTestOptions.maintainer),
        ]).then((res) => {
          if (this.isRevert) {
            this.revertTests.push(res[0]);
            this.isRevert = false;
          }
          this.allTests.push(res[0]);
          this.currentTestId = res[0];
          this.zebrunnerApiClient.startTestSession(testStats, this.browserCapabilities, res[0]),
          this.sendTestAttachments(this.currentTestId, this.currentTestOptions);
        })
      } catch (e) {
        console.log(e);
      }
    });
  }

  sendTestAttachments(testId, options) {
    this.zebrunnerApiClient.sendTestLabels(testId, options);
    this.zebrunnerApiClient.sendTestArtifacts(testId, options);
    this.zebrunnerApiClient.sendTestArtifactReferences(testId, options);

    this.currentTestOptions = {
      maintainer: '',
      testTcmOptions: [],
      labels: [],
      attachments: [],
      references: [],
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
    this.currentTestOptions.maintainer = maintainer;
  }

  setTestTcmOptions(options) {
    const testTcmOptions = parseTcmTestOptions(options, this.runOptions.tcmConfig)
    this.currentTestOptions.testTcmOptions = testTcmOptions;
  }

  setRunTcmOptions(options) {
    this.runOptions.tcmConfig = parseTcmRunOptions(options);
  }

  setRunLabels(labels) {
    this.runOptions.labels.push(parseLabels(labels));
  }

  setTestLabels(labels) {
    this.currentTestOptions.labels.push(parseLabels(labels));
  }

  attachToTestRun(attachments) {
    this.runOptions.attachments = attachments;
  }

  attachReferenceToTestRun(references) {
    this.runOptions.references = references;
  }

  attachToTest(attachments) {
    this.currentTestOptions.attachments = attachments;
  }

  attachReferenceToTest(references) {
    this.currentTestOptions.references = references;
  }

  // setTestLogs(logs, level) {
    // this.currentTestOptions.logs.push(parseLogs(logs, level));
  // }

  revertTestRegistration(isRevert) {
    this.isRevert = isRevert;
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