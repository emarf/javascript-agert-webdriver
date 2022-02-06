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
  getTestLabels,
  getTestsSearch,
} from './request-builder';
import {
  getTestArtifacts,
  getArtifactReferences,
  getVideoAttachments,
  getFileSizeInBytes,
  getScreenshotAttachments,
} from './utils';
import { commonHeaders, urls } from './constants';
export default class ZebrunnerApiClient {
  private reporterConfig;
  private httpClient;
  private accessToken;
  private runStats;
  private sessionOptions;
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig
    this.httpClient = new HttpClient(this.reporterConfig)
    this.accessToken;
    this.runStats = {
      zbrTestId: '',
      sessionId: '',
      runId: '',
    }
    this.sessionOptions = [];
  }

  async refreshToken() {
    if (!this.accessToken) {
      const res = await this.httpClient.fetchRequest('POST', urls.URL_REFRESH, process.env.REPORTING_SERVER_ACCESS_TOKEN, commonHeaders.jsonHeaders.headers)
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
    const project = this.reporterConfig.reportingProjectKey ? this.reporterConfig.reportingProjectKey  : 'DEF';
    const testRunStartBody = getTestRunStart(suite, this.reporterConfig)
    try {
      const response = await this.httpClient.fetchRequest('POST', urls.URL_REGISTER_RUN.replace('${project}', project), testRunStartBody, headers);
      this.runStats.runId = response.data.id;
      console.log("Run id was registered: " + this.runStats.runId)
      return response.data.id;
    } catch (e) {
      console.log(e)
    }
  }

  async registerTestRunFinish(test) {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      await this.httpClient.fetchRequest('PUT', urls.URL_FINISH_RUN.concat(this.runStats.runId), getTestRunEnd(test), headers);
      console.log(`Run with id ${this.runStats.runId} was finished`)
    } catch (e) {
      console.log(e)
    }
  }

  async startTest(test, maintainer) {
    try {
      const url = urls.URL_START_TEST.replace('${testRunId}', this.runStats.runId);
      const testStartBody = getTestStart(test, maintainer);
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const response = await this.httpClient.fetchRequest('POST', url, testStartBody, headers);
      this.runStats.zbrTestId = response.data.id;

      console.log(`Test '${test.fullTitle}' was registered by id ${this.runStats.zbrTestId}`);
      return response.data.id;
    } catch (e) {
      console.log(e)
    }
  }

  async finishTest(test) {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const testEnd = getTestEnd(test);
      const url = urls.URL_FINISH_TEST.replace('${testRunId}', this.runStats.runId).replace('${testId}', this.runStats.zbrTestId);
      const response = await this.httpClient.fetchRequest('PUT', url, testEnd, headers);
      console.log(`Test with ID ${this.runStats.zbrTestId} was finished with status ${test.state.toUpperCase()}`);
      return response;
    } catch (e) {
      console.log(e)
    }
  }

  async startTestSession(test, capabilities, testId) {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const testSession = getTestSessionStart(test, testId, capabilities);
      const url = urls.URL_START_SESSION.replace('${testRunId}', this.runStats.runId);
      const response = await this.httpClient.fetchRequest('POST', url, testSession, headers);

      this.runStats.sessionId = response.data.id;
      this.sessionOptions.push({ uid: test.uid, sessionId: response.data.id });

      console.log(`Session with id ${response.data.id} was registered for test '${test.fullTitle}'`);
    } catch (e) {
      console.log(e)
    }
  }

  async finishTestSession(test) {
    try {
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const testSession = getTestSessionEnd(test, this.runStats.zbrTestId);
      const url = urls.URL_UPDATE_SESSION.replace('${testRunId}', this.runStats.runId).replace('${testSessionId}', this.runStats.sessionId);

      const response = await this.httpClient.fetchRequest('PUT', url, testSession, headers);
      console.log(`Session with id ${this.runStats.sessionId} was finish`)
      return response;
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

  async sendRunLabels(options) {
    try {
      const url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runStats.runId)
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const runLabels = getTestRunLabels(this.reporterConfig, options);

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

  async sendTestLabels(testId, options) {
    try {
      const url = urls.URL_SET_TEST_LABELS.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
      const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
      const payload = getTestLabels(options);
      if (payload.items.length > 0) {
        const response = await this.httpClient.fetchRequest('PUT', url, payload, headers);
        return response;
      } else {
        console.log(`No labels for test ${testId}`)
      }
    } catch (e) {
      console.log(e);
    }
  }

  async sendScreenshots(test, testId) {
    try {
      const url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
      let headers = await this.getHeadersWithAuth(commonHeaders.imageHeaders);
      const arrOfScreenshots = getScreenshotAttachments(test.title, test.parent);
      if (!testId || !arrOfScreenshots) {
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
    if (formData) {
      return;
    }
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

  async sendTestArtifacts(testId, options) {
    const url = urls.URL_SEND_TEST_ARTIFACTS.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    if (options.attachments.length > 0) {
      await this._attachmentBody(url, options.attachments, testId);
    } else {
      console.log(`No files for test ${testId}`);
    }
  }

  async sendRunArtifacts(options) {
    const url = urls.URL_SEND_RUN_ARTIFACTS.replace('${testRunId}', this.runStats.runId);
    if (options.attachments.length > 0) {
      await this._attachmentBody(url, options.attachments);
    } else {
      console.log(`No files for run ${this.runStats.runId}`);
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

  async sendTestArtifactReferences(testId, options) {
    const url = urls.URL_SEND_TEST_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId).replace('${testId}', testId);
    if (options.references.length > 0) {
      await this._referenceBody(url, options.references);
    } else {
      console.log(`No ref for test ${testId}`);
    }
  }

  async sendRunArtifactReferences(options) {
    const url = urls.URL_SEND_RUN_ARTIFACT_REFERENCES.replace('${testRunId}', this.runStats.runId);
    if (options.references.length > 0) {
      await this._referenceBody(url, options.references);
    } else {
      console.log(`No ref to run ${this.runStats.runId}`)
    }
  }

  async _referenceBody(url, options, testId = '') {
    const headers = await this.getHeadersWithAuth(commonHeaders.jsonHeaders);
    const attachLinks = getArtifactReferences(options);
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

