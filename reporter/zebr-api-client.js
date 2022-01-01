import HttpClient from './api-client-axios';
import {
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
  getTestSessionStart,
  getTestSessionEnd,
  getTestRunLabels,
  getTestsSearch,
} from './request-builder';
import {
  getTestArtifacts,
  getArtifactReferences,
  getVideoPath,
  getFileSizeInBytes,
} from './utils';
import ConfigResolver from './config-resolver';
import { commonHeaders, urls } from './constants';
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
    this.testSessions = [];
    this.sessionOptions = [];
  }

  async refreshToken() {
    if (!this.accessToken) {
      const res = await this.httpClient.callPost(urls.URL_REFRESH, getRefreshToken(this.configResolver.getReportingServerAccessToken()), commonHeaders.jsonHeaders.headers)
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
    const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
    const project = this.configResolver.getReportingProjectKey() ? this.configResolver.getReportingProjectKey() : 'DEF';
    const testRunStartBody = getTestRunStart(suite, this.reporterConfig)
    try {
      const response = await this.httpClient.callPost(urls.URL_REGISTER_RUN.replace('${project}', project), testRunStartBody, headers);
      this.runStats.runId = response.data.id;
      this.runStats.uniqueTestId = suite.cid;
      console.log("Run id was registered: " + this.runStats.runId)
      return response.data.id;
    } catch (e) {
      console.log(e)
    }
  }

  async registerTestRunFinish(test) {
    try {
      if (this.runStats.runId) {
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
        await this.httpClient.callPut(urls.URL_FINISH_RUN.concat(this.runStats.runId), getTestRunEnd(test), headers);
        console.log(`Run with id ${this.runStats.runId} was finished`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async startTest(test, additionalLabels) {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_START_TEST.replace('${testRunId}', this.runStats.runId);
        const testStartBody = getTestStart(test, additionalLabels);
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
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
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
        const testEnd = getTestEnd(test);
        const url = urls.URL_FINISH_TEST.replace('${testRunId}', this.runStats.runId).replace('${testId}', this.runStats.zbrTestId);

        const response = await this.httpClient.callPut(url, testEnd, headers);

        console.log(`Test with ID ${this.runStats.zbrTestId} was finished with status ${test.state.toUpperCase()}`);

        return response;
      }
    } catch (e) {
      console.log(e)
    }
  }

  async startTestSession(test, capabilities) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
        const testSession = getTestSessionStart(test, this.runStats.zbrTestId, capabilities);
        const url = urls.URL_START_SESSION.replace('${testRunId}', this.runStats.runId);
        const response = await this.httpClient.callPost(url, testSession, headers);

        this.runStats.sessionId = response.data.id;
        this.sessionOptions.push({ uid: test.uid, sessionId: response.data.id });

        console.log(`Session with id ${response.data.id} was registered for test '${test.fullTitle}'`);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async finishTestSession(test) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
        const testSession = getTestSessionEnd(test, this.runStats.zbrTestId);
        const url = urls.URL_UPDATE_SESSION.replace('${testRunId}', this.runStats.runId).replace('${testSessionId}', this.runStats.sessionId);

        const response = await this.httpClient.callPut(url, testSession, headers);
        console.log(`Session with id ${this.runStats.sessionId} was finish`)
        return response;
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendLogs(logs) {
    try {
      const url = urls.URL_SEND_LOGS.replace('${testRunId}', this.runStats.runId);
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const response = await this.httpClient.callPost(url, logs, headers);

      if (response.data.id) {
        console.log(`send logs for all test run`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async sendRunLabels(additionalOptions) {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runStats.runId)
        const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
        const runLabels = getTestRunLabels(this.reporterConfig.reporterOptions, additionalOptions);
        await this.httpClient.callPut(url, runLabels, headers);
        console.log(`Labels was send for run id ${this.runStats.runId}`);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendScreenshot(testId, img, logDate) {
    try {
      console.log(testId);
      console.log(img);
      const url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId)
      let headers = await this.getHeadersWithAuth(commonHeaders.imageHeaders);
      headers['x-zbr-screenshot-captured-at'] = logDate;
      const bufferImage = Buffer.from(img, 'base64');
      console.log(1)
      const response = await this.httpClient.callPost(url, bufferImage, headers);
      console.log(2);
      if (response) {
        console.log(`Screenshot was attach to test id ${testId}`);
        return response;
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendTestVideo(test) {
    const currentSession = this.sessionOptions.filter((item) => item.uid === test.uid);
    const { formData, videoPath } = getVideoPath(test.title, test.parent);
    const url = urls.URL_SEND_SESSION_ARTIFACTS.replace('${testRunId}', this.runStats.runId).replace('${testSessionId}', currentSession[0].sessionId);
    let headers = await this.getHeadersWithAuth(commonHeaders.multipartDataHeaders);
    headers['Content-Type'] = formData.getHeaders()['content-type'];
    headers['x-zbr-video-content-length'] = getFileSizeInBytes(videoPath);
    console.log('video url', url);
    console.log('video path', videoPath);
    const response = await this.httpClient.callPost(url, formData, headers);
    console.log(response.status);
    if (response.status === 201) {
      console.log(`Video send`);
    }
    return response;
  }

  async sendTestArtifacts(additionalOptions, testId) {
    const url = urls.URL_SEND_TEST_ARTIFACTS.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    await this.attachmentBody(url, additionalOptions.testArtifacts.attachToTest, testId);
  }

  async sendRunArtifacts(additionalOptions) {
    const url = urls.URL_SEND_RUN_ARTIFACTS.replace('${testRunId}', this.runStats.runId);
    await this.attachmentBody(url, additionalOptions.runArtifacts.attachToTestRun);
  }

  async attachmentBody(url, attachments, testId = '') {
    let headers = await this.getHeadersWithAuth(commonHeaders.multipartDataHeaders);
    const attachFiles = getTestArtifacts(attachments);
    attachFiles.forEach(async (el) => {
      headers['Content-Type'] = el.getHeaders()['content-type'];
      await this.httpClient.callPost(url, el, headers);
      console.log(`File attach to ${testId ? `test ${testId}` : `run ${this.runStats.runId}`}`);
    })
  }

  async sendTestArtifactReferences(additionalOptions, testId) {
    const url = urls.URL_SEND_TEST_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    await this.referenceBody(url, additionalOptions.testArtifacts.attachReferenceToTest);
  }

  async sendRunArtifactReferences(additionalOptions) {
    const url = urls.URL_SEND_RUN_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId);
    await this.referenceBody(url, additionalOptions.runArtifacts.attachReferenceToTestRun);
  }

  async referenceBody(url, additionalOptions, testId = '') {
    const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
    const attachLinks = getArtifactReferences(additionalOptions);
    await this.httpClient.callPut(url, attachLinks, headers);
    console.log(`References attach to ${testId ? `test ${testId}` : `run ${this.runStats.runId}`}`);
  }

  async searchTests() {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const response = await this.httpClient.callPost(urls.URL_SEARCH_TESTS, getTestsSearch(this.runStats.runId), headers);
      console.log('Search tests');
      return response;
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ZebrunnerApiClient
