const fs = require('fs')
const FormData = require('form-data');
const { HttpClient, jsonHeaders, imageHeaders, multipartDataHeaders } = require("./api-client-axios.js");
const { urls, getRefreshToken, getTestRunStart, getTestRunEnd, getTestStart, getTestEnd, getTestSessionStart, getTestSessionEnd, getTestRunLabels, getTestsSearch } = require("./request-builder.js");
var { getFilesizeInBytes, writeJsonToFile, logToFile, getObjectAsString } = require("./utils");
var { ConfigResolver } = require("./config-resolver");

class ZebrunnerApiClient {

  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig
    this.configResolver = new ConfigResolver(reporterConfig)
    this.httpClient = new HttpClient(this.configResolver)

    this.accessToken
    this.runId
    this.testsMap = new Map();

    this.currentBrowser
    this.currentBrowserSearched = false

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
    var authToken = await this.refreshToken()
    if (authToken) {
      var authHeaders = basicHeaders.headers
      authHeaders['Authorization'] = authToken
      return authHeaders
    }
  }

  async registerTestRunStart(suite) {
    let headers = await this.getHeadersWithAuth(jsonHeaders);
    if (headers) {
      let project = (this.configResolver.getReportingProjectKey()) ? this.configResolver.getReportingProjectKey() : 'DEF';
      let testRunStartBody = getTestRunStart(suite, this.reporterConfig)
      try {
        const response = await this.httpClient.callPost(urls.URL_REGISTER_RUN.replace('${project}', project), testRunStartBody, headers);
        this.runId = response.data.id;
        console.log("Run id was registered: " + this.runId)
        return response;
      } catch (e) {
        console.log(e)
      }
    }
  }

  async registerTestRunFinish() {
    if (this.runId) {
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      await this.httpClient.callPut(urls.URL_FINISH_RUN.concat(this.runId), getTestRunEnd(), headers);
    }
  }

  async startTest(test) {
    if (this.runId) {
      const url = urls.URL_START_TEST.replace('${testRunId}', this.runId);
      const testStartBody = getTestStart(test);
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const response = await this.httpClient.callPost(url, testStartBody, headers);
      this.testsMap.set(test.cid, {
        promiseStart: response,
      })
      this.testsMap.get(test.cid).zbrTestId = response.data.id;

      console.log(`Test '${test.fullTitle}' was registered by id ${response.data.id}`);

      return response;
    }
  }

  async finishTest(test) {
    if (this.testsMap.get(test.cid)) {
      let zbrTestId = this.testsMap.get(test.cid).zbrTestId;
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const testEnd = getTestEnd(test);

      const url = urls.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace('${testId}', zbrTestId);

      await this.httpClient.callPut(url, testEnd, headers);

      console.log(`Test with ID ${zbrTestId} was finished with status ${test.state.toUpperCase()}`);
    }
  }

  async startTestSession(test, capabilities) {
    if (this.testsMap.get(test.cid)) {
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const testSession = getTestSessionStart(test, this.testsMap.get(test.cid).zbrTestId, capabilities);
      const url = urls.URL_START_SESSION.replace('${testRunId}', this.runId);
      const response = await this.httpClient.callPost(url, testSession, headers);

      this.testsMap.get(test.cid).zbrSessionId = response.data.id;

      console.log(`Session with id ${response.data.id} was registered for test '${test.fullTitle}'`);
    }
  }

  async finishTestSession(test) {
    if (this.testsMap.get(test.cid)) {
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const testSession = getTestSessionEnd(test, this.testsMap.get(test.cid).zbrTestId);
      const url = urls.URL_UPDATE_SESSION.replace('${testRunId}', this.runId).replace('${testSessionId}', this.testsMap.get(test.cid).zbrSessionId);
      await this.httpClient.callPut(url, testSession, headers);
    }
  }

  async sendLogs(test, level = 'INFO', messages) {
    if (this.testsMap.get(test.cid)) {
      const testId = this.testsMap.get(test.cid).zbrTestId;
      const logs = messages.map((el) => ({ testId, level, ...el }))
      console.log(logs)
      console.log('runId', this.runId)
      const url = urls.URL_SEND_LOGS.replace('${testRunId}', this.runId)
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      await this.httpClient.callPost(url, logs, headers).then(() => {
        console.log(`logs were sent for test ${testId}`)
      })
    }
  }

  async sendRunLabels() {
    if (this.runId) {
      let url = urls.URL_SET_RUN_LABELS.replace('${testRunId}', this.runId)
      var headers = await this.getHeadersWithAuth(jsonHeaders);
      let runLabels = getTestRunLabels(this.reporterConfig.reporterOptions)
      this.httpClient.callPut(url, runLabels, headers)
    }
  }

  sendScreenshot(test, imgPath) {
    if (this.testsMap.get(test.uniqueId)) {
      // todo: attach header x-zbr-screenshot-captured-at
      let url = urls.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runId).replace('${testId}', this.testsMap.get(test.uniqueId).zbrTestId)
      var headers = this.getHeadersWithAuth(imageHeaders);

      var httpClient = this.httpClient
      return fs.readFile(imgPath, function (err, data) {
        if (err) throw err;
        return httpClient.callPost(url, data, headers, false, true)
      });
    }
  }

  sendVideo(videoFilePath, runId, zbrSessionId) {
    try {
      if (fs.existsSync(videoFilePath)) {
        var url = urls.URL_SEND_SESSION_ARTIFACTS.replace('${testRunId}', runId).replace('${testSessionId}', zbrSessionId);
        var headers = this.getHeadersWithAuth(multipartDataHeaders)

        const formData = new FormData();
        formData.append('video', fs.createReadStream(videoFilePath));
        headers['Content-Type'] = formData.getHeaders()['content-type']
        headers['x-zbr-video-content-length'] = getFilesizeInBytes(videoFilePath)
        return this.httpClient.callPost(url, formData, headers)
      }
    } catch (err) {
      console.error(err)
      return new Promise(resolve => { resolve() })
    }
  }

  parseResultsAndSendVideo() {
    var promises = []
    this.testsMap.forEach((value) => {
      if (this.configResolver.getDebugLogging()) {
        logToFile(getObjectAsString(value))
      }
      if (value.videoFilePath && value.state === 'failed') {
        console.log('video will be pushed')
        if (this.configResolver.getDebugLogging()) {
          logToFile('video will be pushed: ' + value.videoFilePath)
        }
        promises.push(this.sendVideo(value.videoFilePath, this.runId, value.zbrSessionId));
      }
    })
    if (promises.length > 0) {
      return Promise.all(promises);
    }
    else {
      return new Promise(resolve => { resolve() })
    }
  }

  async searchTests() {
    var headers = await this.getHeadersWithAuth(jsonHeaders);
    return this.httpClient.callPost(urls.URL_SEARCH_TESTS, getTestsSearch(this.runId), headers);
  }

  storeResultsToFile() {
    const results = new Object()
    results['runId'] = this.runId
    results['testsMap'] = Array.from(this.testsMap.entries())
    writeJsonToFile('cypress/zbr-report', 'zbr-results.json', results);
  }
}

// new ZebrunnerApiClient({
// "reporterOptions": {
//     "reportingServerHostname": "https://",
//     "reportingServerAccessToken": "",
//     "reportingProjectKey": "DEMO"
//   }
// }).somemethod

module.exports = ZebrunnerApiClient
