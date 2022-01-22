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
  getVideoAttachments,
  getFileSizeInBytes,
  getScreenshotAttachments,
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
      const res = await this.httpClient.fetchRequest('POST', urls.URL_REFRESH, getRefreshToken(this.configResolver.getReportingServerAccessToken()), commonHeaders.jsonHeaders.headers)
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
      const response = await this.httpClient.fetchRequest('POST', urls.URL_REGISTER_RUN.replace('${project}', project), testRunStartBody, headers);
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
        await this.httpClient.fetchRequest('PUT', urls.URL_FINISH_RUN.concat(this.runStats.runId), getTestRunEnd(test), headers);
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
        const response = await this.httpClient.fetchRequest('POST', url, testStartBody, headers);
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

        const response = await this.httpClient.fetchRequest('PUT', url, testEnd, headers);

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
        const response = await this.httpClient.fetchRequest('POST', url, testSession, headers);

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

        const response = await this.httpClient.fetchRequest('PUT', url, testSession, headers);
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
      const response = await this.httpClient.fetchRequest('POST', url, logs, headers);

      if (response.data.id) {
        console.log(`send logs for all test run`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async sendRunLabels(additionalOptions) {
    try {
      const url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runStats.runId)
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const runLabels = getTestRunLabels(this.reporterConfig.reporterOptions, additionalOptions);
      console.log(runLabels);
      if (runLabels.items.length > 0) {
        await this.httpClient.fetchRequest('PUT', url, runLabels, headers);
        console.log(`Labels were send for run id ${this.runStats.runId}`);
      } else {
        console.log(`No labels for run id ${this.runStats.runId}`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendScreenshots(test, testId) {
    try {
      const url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
      let headers = await this.getHeadersWithAuth(commonHeaders.imageHeaders);
      const arrOfScreenshots = getScreenshotAttachments(test.title, test.parent);

      if (!testId) {
        return;
      }

      Promise.all(arrOfScreenshots.map(async (screen, index) => {
        headers['x-zbr-screenshot-captured-at'] = test.start.getTime() + index + 1;
        return await this.httpClient.fetchRequest('POST', url, screen, headers);
      })).then((res) => {
        if (res) {
          console.log(`Screenshots were attached to the test id ${testId}`);
        }
      }).catch((e) => console.log(e));
    } catch (e) {
      console.log(e)
    }
  }

  async sendTestVideo(test) {
    const currentSession = this.sessionOptions.filter((item) => item.uid === test.uid);
    const { formData, videoPath } = await getVideoAttachments(test.title, test.parent);
    const url = urls.URL_SEND_SESSION_ARTIFACTS.replace('${testRunId}', this.runStats.runId).replace('${testSessionId}', currentSession[0].sessionId);
    let headers = await this.getHeadersWithAuth(commonHeaders.multipartDataHeaders);
    headers['Content-Type'] = formData.getHeaders()['content-type'];
    headers['x-zbr-video-content-length'] = getFileSizeInBytes(videoPath);
    const response = await this.httpClient.fetchRequest('POST', url, formData, headers);
    if (response.status === 201) {
      console.log(`Video send`);
    }
    return response;
  }

  async sendTestArtifacts(additionalOptions, testId) {
    const url = urls.URL_SEND_TEST_ARTIFACTS.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    if (additionalOptions.testArtifacts.attachToTest) {
      await this._attachmentBody(url, additionalOptions.testArtifacts.attachToTest, testId);
    }
  }

  async sendRunArtifacts(additionalOptions) {
    const url = urls.URL_SEND_RUN_ARTIFACTS.replace('${testRunId}', this.runStats.runId);
    if (additionalOptions.runArtifacts.attachToTestRun) {
      await this._attachmentBody(url, additionalOptions.runArtifacts.attachToTestRun);
    }
  }

  async _attachmentBody(url, attachments, testId = '') {
    let headers = await this.getHeadersWithAuth(commonHeaders.multipartDataHeaders);
    const attachFiles = getTestArtifacts(attachments);
    attachFiles.forEach(async (el) => {
      headers['Content-Type'] = el.getHeaders()['content-type'];
      await this.httpClient.fetchRequest('POST', url, el, headers);
      console.log(`File attach to ${testId ? `test ${testId}` : `run ${this.runStats.runId}`}`);
    })
  }

  async sendTestArtifactReferences(additionalOptions, testId) {
    const url = urls.URL_SEND_TEST_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    if (additionalOptions.testArtifacts.attachReferenceToTest) {
      await this._referenceBody(url, additionalOptions.testArtifacts.attachReferenceToTest);
    }
  }

  async sendRunArtifactReferences(additionalOptions) {
    const url = urls.URL_SEND_RUN_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId);
    if (additionalOptions.runArtifacts.attachReferenceToTestRun) {
      await this._referenceBody(url, additionalOptions.runArtifacts.attachReferenceToTestRun);
    }
  }

  async _referenceBody(url, additionalOptions, testId = '') {
    const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
    const attachLinks = getArtifactReferences(additionalOptions);
    await this.httpClient.fetchRequest('PUT', url, attachLinks, headers);
    console.log(`References attach to ${testId ? `test ${testId}` : `run ${this.runStats.runId}`}`);
  }

  async revertTestRegistration(testId) {
    const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
    const url = urls.URL_REVERT_TEST_REGISTRATION.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    const response = await this.httpClient.fetchRequest('DELETE', url, null, headers);
    if (response) {
      console.log(`Test with id ${testId} revert`);
    }
  }

  async searchTests() {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const response = await this.httpClient.fetchRequest('POST', urls.URL_SEARCH_TESTS, getTestsSearch(this.runStats.runId), headers);
      console.log('Search tests');
      return response;
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ZebrunnerApiClient
