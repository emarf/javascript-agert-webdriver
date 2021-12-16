import WDIOReporter, { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter'
import ZebrunnerApiClient from './zebr-api-client';
import { getTestCapabilities } from './object-transformer';
import { parseDate } from './utils'

export default class CustomReporter extends WDIOReporter {
  constructor(reporterConfig) {
    super(reporterConfig);
    this.reporterConfig = { reporterOptions: this.options };
    this.zebrunnerApiClient = new ZebrunnerApiClient(this.reporterConfig);
    this.capabilities;
    this.storage;
    this.syncReporting = false;
    this.response;
    this.testLogs = [];
  }

  get isSynchronised() {
    return this.syncReporting;
  }

  set isSynchronised(val) {
    this.syncReporting = val;
  }

  onRunnerStart(runObj) {
    console.log('onRunnerStart')
    this.capabilities = getTestCapabilities(runObj);
  }
  onSuiteStart(suite) {
    console.log('onSuiteStart');
    this.response = this.zebrunnerApiClient.registerTestRunStart(suite);
  }
  onTestStart(testStats) {
    console.log('onTestStart');
    try {
      this.createLog(testStats, true, false);
      this.response.then(async () => {
        await this.zebrunnerApiClient.startTest(testStats);
        await this.zebrunnerApiClient.startTestSession(testStats, this.capabilities);
      })
    } catch (e) {
      console.log(e)
    }
  }
  onTestPass(testStats) {
    console.log('onTestPass');
    this.createLog(testStats, false, true)
    this.zebrunnerApiClient.finishTestSession(testStats);
    this.zebrunnerApiClient.finishTest(testStats);
  }
  // onTestFail(testStats) {
  //   console.log('onTestFail')
  //   this.zebrunnerApiClient.finishTestSession(testStats);
  //   this.zebrunnerApiClient.finishTest(testStats);
  // }
  async onRunnerEnd(testStats) {
    console.log('onRunnerEnd');
    try {
      let isReadyToFinish = false;
      await this.zebrunnerApiClient.sendLogs(testStats, 'INFO', this.testLogs)

      const response = await this.zebrunnerApiClient.searchTests();

      response.data.results.forEach((el) => {
        if (el.status === 'IN_PROGRESS') {
          isReadyToFinish = true;
        }
      })

      if (!isReadyToFinish) {
        await this.zebrunnerApiClient.registerTestRunFinish();
      }

    } catch (e) {
      console.log(e);
    } finally {
      this.isSynchronised = true;
    }

  }
  onAfterCommand(test) {
    console.log(test)
    if (Object.keys(test.body).length !== 0) {
      this.createLog(test);
    }
  }

  createLog(test, isStart = false, isEnd = false) {
    let testLog;
    if (isStart) {
      testLog = {
        message: `TEST ${test.fullTitle} STARTED at ${parseDate(test.start)}`,
        timestamp: `${test.start.getTime()}`,
      }
    }

    if (isEnd) {
      testLog = {
        message: `TEST ${test.fullTitle} ${test.state.toUpperCase()} at ${parseDate(test.end)}`,
        timestamp: `${test.end.getTime()}`,
      }
    }

    if (!isStart && !isEnd) {
      testLog = {
        message: JSON.stringify(test.body),
        timestamp: `${Date.now()}`,
      }
    }

    this.testLogs.push(testLog)
  }



}