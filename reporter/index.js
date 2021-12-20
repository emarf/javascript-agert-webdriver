import WDIOReporter from '@wdio/reporter'
import ZebrunnerApiClient from './zebr-api-client';
import { getTestCapabilities } from './object-transformer';
import { parseDate } from './utils';

export default class CustomReporter extends WDIOReporter {
  constructor(reporterConfig) {
    super(reporterConfig);
    this.reporterConfig = { reporterOptions: this.options };
    this.zebrunnerApiClient = new ZebrunnerApiClient(this.reporterConfig);
    this.browserCapabilities;
    this.syncReporting = false;
    this.response;
    this.testLogs = [];
    this.logDate;
    this.isRetry;
  }

  get isSynchronised() {
    return this.syncReporting;
  }

  set isSynchronised(val) {
    this.syncReporting = val;
  }

  onRunnerStart(runStats) {
    console.log('onRunnerStart')
    this.browserCapabilities = getTestCapabilities(runStats);
  }
  onSuiteStart(suiteStats) {
    console.log('onSuiteStart');
    //!TODO all tests in one run(try to create uuid when start)
    this.response = this.zebrunnerApiClient.registerTestRunStart(suiteStats);
  }
  onTestStart(testStats) {
    console.log('onTestStart');
    this.createLog(testStats, 'start');
    this.response.then(() => {
      try {
        this.zebrunnerApiClient.startTest(testStats);
        this.zebrunnerApiClient.startTestSession(testStats, this.browserCapabilities);
        this.zebrunnerApiClient.sendRunLabels();
      } catch (e) {
        console.log(e)
      }
    })
  }
  onTestPass(testStats) {
    console.log('onTestPass');
    this.createLog(testStats, 'end')
    this.zebrunnerApiClient.finishTestSession(testStats);
    this.zebrunnerApiClient.finishTest(testStats);
  }

  onTestFail(testStats) {
    console.log('onTestFail')
    this.createLog(testStats, 'fail');
    this.createLog(testStats, 'end');
    this.zebrunnerApiClient.finishTestSession(testStats);
    this.zebrunnerApiClient.finishTest(testStats);
  }

  async onRunnerEnd(runStats) {
    console.log('onRunnerEnd');
    try {
      let isReadyToFinish = false;
      await this.zebrunnerApiClient.sendLogs(runStats, this.testLogs)
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

  onAfterCommand(command) {
    const methods = ['POST', "GET"];
    try {
      if (this.isRetry !== command.endpoint && methods.includes(command.method)) {
        const hasScreenshot = /screenshot$/.test(command.endpoint) && !!command.result.value;

        if (hasScreenshot) {
          this.zebrunnerApiClient.sendScreenshot(command, command.result.value, this.logDate);
          return;
        }

        this.createLog(command, 'log');
        browser.takeScreenshot()
      }
      this.isRetry = command.endpoint
    } catch (e) {
      console.log(e)
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
        }
        break;
      }
      case 'end': {
        testLog = {
          level: 'INFO',
          message: `TEST ${testStats.fullTitle} ${testStats.state.toUpperCase()} at ${parseDate(testStats.end)}`,
          timestamp: `${testStats.end.getTime() + 1}`,
        }
        break;
      }
      case 'fail': {
        testLog = {
          level: 'ERROR',
          message: `Error ${testStats.errors[0].message} at ${parseDate(testStats.end)}`,
          timestamp: `${testStats.end.getTime()}`,
        }
        break
      }
      default: {
        testLog = {
          level: 'TRACE',
          message: `${testStats.body.url || testStats.body.value || testStats.body.text || testStats.result.value} at ${parseDate(new Date)}`,
          timestamp: `${this.logDate}`,
        }
        break;
      }
    }
    this.testLogs.push(testLog)
  }


  // isScreenshotCommand(command) {
  //   const isScreenshotEndpoint = /\/session\/[^/]*(\/:sessionId\/[^/]*)?\/screenshot/;
  //   return command && isScreenshotEndpoint.test(command);
  // }
}