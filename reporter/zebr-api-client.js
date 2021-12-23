import { HttpClient, jsonHeaders, imageHeaders, multipartDataHeaders } from './api-client-axios';
import { urls, getRefreshToken, getTestRunStart, getTestRunEnd, getTestStart, getTestEnd, getTestSessionStart, getTestSessionEnd, getTestRunLabels, getTestsSearch } from './request-builder';
import ConfigResolver from './config-resolver';
class ZebrunnerApiClient {
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig
    this.configResolver = new ConfigResolver(reporterConfig)
    this.httpClient = new HttpClient(this.configResolver)
    this.accessToken;
    this.runStats = {
      uniqueTestId: '',
      zbrTestId: '',
      sessionId: '',
      runId: '',
    }
  }

  async refreshToken() {
    if (!this.accessToken) {
      const res = await this.httpClient.callPost(urls.URL_REFRESH, getRefreshToken(this.configResolver.getReportingServerAccessToken()), jsonHeaders.headers)
      const token = res.data.authTokenType + ' ' + res.data.authToken
      this.accessToken = token;
    }
    return this.accessToken;
  }

  async getHeadersWithAuth(basicHeaders) {
    const authToken = await this.refreshToken()
    if (authToken) {
      let authHeaders = basicHeaders.headers
      authHeaders['Authorization'] = authToken
      return authHeaders
    }
  }

  async registerTestRunStart(suite) {
    const headers = await this.getHeadersWithAuth(jsonHeaders);
    if (headers) {
      const project = this.configResolver.getReportingProjectKey() ? this.configResolver.getReportingProjectKey() : 'DEF';
      const testRunStartBody = getTestRunStart(suite, this.reporterConfig)
      try {
        const response = await this.httpClient.callPost(urls.URL_REGISTER_RUN.replace('${project}', project), testRunStartBody, headers);
        this.runStats.runId = response.data.id;
        this.runStats.uniqueTestId = suite.cid;
        console.log("Run id was registered: " + this.runStats.runId)
        return response;
      } catch (e) {
        console.log(e)
      }
    }
  }

  async registerTestRunFinish(test) {
    try {
      if (this.runStats.runId) {
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        await this.httpClient.callPut(urls.URL_FINISH_RUN.concat(this.runStats.runId), getTestRunEnd(test), headers);
        console.log(`Run with id ${this.runStats.runId} was finished`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async startTest(test, additionalOptions) {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_START_TEST.replace('${testRunId}', this.runStats.runId);
        const testStartBody = getTestStart(test, additionalOptions);
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const response = await this.httpClient.callPost(url, testStartBody, headers);
        this.runStats.zbrTestId = response.data.id;
        this.runStats.uniqueTestId = test.cid;

        console.log(`Test '${test.fullTitle}' was registered by id ${this.runStats.zbrTestId}`);
        return response.data.id;
      }
    } catch (e) {
      console.log(e)
    }
  }

  async finishTest(test) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const testEnd = getTestEnd(test);
        const url = urls.URL_FINISH_TEST.replace('${testRunId}', this.runStats.runId).replace('${testId}', this.runStats.zbrTestId);

        await this.httpClient.callPut(url, testEnd, headers);

        console.log(`Test with ID ${this.runStats.zbrTestId} was finished with status ${test.state.toUpperCase()}`);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async startTestSession(test, capabilities) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const testSession = getTestSessionStart(test, this.runStats.zbrTestId, capabilities);
        const url = urls.URL_START_SESSION.replace('${testRunId}', this.runStats.runId);
        const response = await this.httpClient.callPost(url, testSession, headers);

        this.runStats.sessionId = response.data.id;

        console.log(`Session with id ${response.data.id} was registered for test '${test.fullTitle}'`);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async finishTestSession(test) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const testSession = getTestSessionEnd(test, this.runStats.zbrTestId);
        const url = urls.URL_UPDATE_SESSION.replace('${testRunId}', this.runStats.runId).replace('${testSessionId}', this.runStats.sessionId);

        await this.httpClient.callPut(url, testSession, headers);
        console.log(`Session with id ${this.runStats.sessionId} was finish`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendLogs(test, logs) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const url = urls.URL_SEND_LOGS.replace('${testRunId}', this.runStats.runId);
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const response = await this.httpClient.callPost(url, logs, headers);

        if (response.data.id) {
          console.log(`send logs for all test run`);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async sendRunLabels() {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runStats.runId)
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const runLabels = getTestRunLabels(this.reporterConfig.reporterOptions)
        await this.httpClient.callPut(url, runLabels, headers)
        console.log(`Labels was send for run id ${this.runStats.runId}`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendScreenshot(testId, test, img, logDate) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId)
        let headers = await this.getHeadersWithAuth(imageHeaders);
        headers['x-zbr-screenshot-captured-at'] = logDate;
        const bufferImage = Buffer.from(img, 'base64');

        await this.httpClient.callPost(url, bufferImage, headers);
        console.log(`Screenshot was attach to test id ${testId}`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async searchTests() {
    try {
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const response = await this.httpClient.callPost(urls.URL_SEARCH_TESTS, getTestsSearch(this.runStats.runId), headers);
      console.log('Search tests');
      return response;
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ZebrunnerApiClient
