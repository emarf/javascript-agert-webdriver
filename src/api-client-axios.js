import axios from 'axios';
export default class HttpClient {
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
    this.baseUrl = reporterConfig.reportingServerHostname;
    // set config defaults when creating the instance
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {},
    });
  }

  async fetchRequest(method, url, body, headers) {
    try {
      const config = {
        headers: headers,
      }

      let response;

      if (method === 'PUT') {
        response = await this.axiosClient.put(url, body, config);
      }
      if (method === 'POST') {
        response = await this.axiosClient.post(url, body, config);
      }
      if (method === 'DELETE') {
        response = await this.axiosClient.delete(url, config);
      }

      this._positiveLog(response, url, body);

      return response;
    } catch (error) {
      this._errorLog(error);
    }
  }

  _positiveLog(promise, url) {
    console.log(`POST relative url: ${url} with status: ${promise.status}`);
  }

  _errorLog(error) {
    console.log(error.response.data)
    if (error.response) {
      console.error(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`);
    } else if (error.data) {
      console.error((error.data) ? error.data : error.response.data);
    } else {
      console.error(error);
    }
  }
};