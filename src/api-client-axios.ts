import axios from 'axios';
export default class HttpClient {
  private reporterConfig;
  private baseUrl;
  private axiosClient;
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
    this.baseUrl = this.reporterConfig.reportingServerHostname;
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

      this._positiveLog(response, url);

      return response;
    } catch (error) {
      this._errorLog(error, url);
    }
  }

  _positiveLog(promise, url) {
    console.log(`POST relative url: ${url} with status: ${promise.status}`);
  }

  _errorLog(error, url) {
    console.log('error url', url)
    if (error.response) {
      console.log(1)
      console.error(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`);
      console.log(error.response.data);
    } else if (error.data) {
      console.log(2)
      console.error((error.data) ? error.data : error.response.data);
      console.log(error.response)
    } else {
      console.log(3);
      console.error(error);
    }
  }
};