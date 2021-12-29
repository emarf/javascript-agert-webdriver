import axios from 'axios';
export default class HttpClient {
  constructor(configResolver) {
    this.configResolver = configResolver;
    this.baseUrl = configResolver.getReportingServerHostname();
    // set config defaults when creating the instance
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {},
    });
  }

  async callPost(url, body, headers) {
    try {
      const config = {
        headers: headers
      }
      const postPromise = await this.axiosClient.post(url, body, config);
      this._positiveLog(postPromise, url, body);

      return postPromise;
    } catch (error) {
      this._errorLog(error);
    }
  }

  async callPut(url, body, headers, log = false, forceDisableLog = false) {
    try {
      const config = {
        headers: headers,
      }
      const putPromise = await this.axiosClient.put(url, body, config);
      this._positiveLog(putPromise, url, body, log, forceDisableLog);
    } catch (error) {
      this._positiveLog(error, forceDisableLog);
    }
  }

  _positiveLog(promise, url) {
    console.log(`POST relative url: ${url}`);
    console.log(`RESPONSE status: ${promise.status}`);
  }

  _errorLog(error) {
    if (error.response) {
      console.error(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`);
    } else if (error.data) {
      console.error((error.data) ? error.data : error.response.data);
    } else {
      console.error(error);
    }
  }
};