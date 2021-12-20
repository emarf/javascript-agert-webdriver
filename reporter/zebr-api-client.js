// const fs = require('fs')
// const FormData = require('form-data');
const { HttpClient, jsonHeaders, imageHeaders, multipartDataHeaders } = require("./api-client-axios.js");
const { urls, getRefreshToken, getTestRunStart, getTestRunEnd, getTestStart, getTestEnd, getTestSessionStart, getTestSessionEnd, getTestRunLabels, getTestsSearch } = require("./request-builder.js");
// const { getFilesizeInBytes, writeJsonToFile } = require("./utils");
const { ConfigResolver } = require("./config-resolver");

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
      const res = await this.httpClient.callPost(urls.URL_REFRESH, getRefreshToken(this.configResolver.getReportingServerAccessToken()), jsonHeaders.headers, false, true)
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

  async registerTestRunFinish() {
    try {
      if (this.runStats.runId) {
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        await this.httpClient.callPut(urls.URL_FINISH_RUN.concat(this.runStats.runId), getTestRunEnd(), headers);
      }
    } catch (e) {
      console.log(e)
    }
  }

  async startTest(test) {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_START_TEST.replace('${testRunId}', this.runStats.runId);
        const testStartBody = getTestStart(test);
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const response = await this.httpClient.callPost(url, testStartBody, headers);

        this.runStats.zbrTestId = response.data.id;
        this.runStats.uniqueTestId = test.cid;

        console.log(`Test '${test.fullTitle}' was registered by id ${this.runStats.zbrTestId}`);
        return response;
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
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendLogs(test, messages) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const testId = this.runStats.zbrTestId;
        const logs = messages.map((el) => ({ testId, ...el }))
        const url = urls.URL_SEND_LOGS.replace('${testRunId}', this.runStats.runId)
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const response = await this.httpClient.callPost(url, logs, headers);

        if (response.data.id) {
          console.log(`logs were sent for test ${testId}`)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendRunLabels() {
    try {
      if (this.runStats.runId) {
        const url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runStats.runId)
        const headers = await this.getHeadersWithAuth(jsonHeaders);
        const runLabels = getTestRunLabels(this.reporterConfig.reporterOptions)
        await this.httpClient.callPut(url, runLabels, headers)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async sendScreenshot(test, img, logDate) {
    try {
      if (this.runStats.uniqueTestId === test.cid) {
        const url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runStats.runId).replace('${testId}', this.runStats.zbrTestId)
        let headers = await this.getHeadersWithAuth(imageHeaders);
        headers['x-zbr-screenshot-captured-at'] = logDate + 1;
        const bufferImage = Buffer.from(img, 'base64');

        await this.httpClient.callPost(url, bufferImage, headers, false, true)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async searchTests() {
    try {
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      return this.httpClient.callPost(urls.URL_SEARCH_TESTS, getTestsSearch(this.runStats.runId), headers);
    } catch (e) {
      console.log(e)
    }
  }

  // sendVideo(videoFilePath, runId, zbrSessionId) {
  //   try {
  //     if (fs.existsSync(videoFilePath)) {
  //       var url = urls.URL_SEND_SESSION_ARTIFACTS.replace('${testRunId}', runId).replace('${testSessionId}', zbrSessionId);
  //       var headers = this.getHeadersWithAuth(multipartDataHeaders)

  //       const formData = new FormData();
  //       formData.append('video', fs.createReadStream(videoFilePath));
  //       headers['Content-Type'] = formData.getHeaders()['content-type']
  //       headers['x-zbr-video-content-length'] = getFilesizeInBytes(videoFilePath)
  //       return this.httpClient.callPost(url, formData, headers)
  //     }
  //   } catch (err) {
  //     console.error(err)
  //     return new Promise(resolve => { resolve() })
  //   }
  // }

  // parseResultsAndSendVideo(test) {
  //   const t = test.fullTitle;
  //   const a = t.replaceAll(' ', '-').replaceAll('.', '--');
  //   console.log('video name', a);
  //   const aaaa = fs.createReadStream('./reports/video')
  //   // console.log('video path', aaaa);
  // }
}

module.exports = ZebrunnerApiClient
