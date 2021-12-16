const axios = require('axios')
const { getObjectAsString, logToFile } = require('./utils')

const jsonHeaders = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

const imageHeaders = {
  headers: {
    'Content-Type': 'image/png'
  }
}

const multipartDataHeaders = {
  headers: {
    'Accept': '*/*'
  }
}

class HttpClient {
  constructor(configResolver) {
    this.configResolver = configResolver;
    this.baseUrl = configResolver.getReportingServerHostname();
    this.debugLogging = configResolver.getDebugLogging()
    // set config defaults when creating the instance
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {}
    });
  }

  async callPost(url, body, headers, log = false, forceDisableLog = false) {
    const config = {
      headers: headers
    }

    try {
      const postPromise = await this.axiosClient.post(url, body, config);
      console.log(`POST relative url: ${url}`);
      if (log) {
        console.log(`request body: ${getObjectAsString(body)}`);
        console.log(`response body: ${getObjectAsString(postPromise.data)}`);
      }
      console.log(`RESPONSE status: ${postPromise.status}`);
      if (this.debugLogging) {
        logToFile(`POST relative url: ${url}`);
        if (!forceDisableLog) {
          logToFile(`request body: ${getObjectAsString(body)}`);;
          logToFile(`RESPONSE status: ${postPromise.status}`);
        }

        if (!forceDisableLog) {
          logToFile(`response body: ${getObjectAsString(postPromise.data)}`);
        }
      }
      return postPromise;
    } catch (error) {
      console.log(`POST relative url: ${url}`)
      if (log) {
        console.log(`request body: ${getObjectAsString(body)}`)
      }
      if (error.response) {
        console.error(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`)
      } else if (error.data) {
        console.error((error.data) ? error.data : error.response.data)
      } else {
        console.error(error)
      }
      if (this.debugLogging) {
        logToFile(`POST relative url: ${url}`)
        if (!forceDisableLog) {
          logToFile(`request body: ${getObjectAsString(body)}`)
        }
        if (error.response) {
          logToFile(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`)
        }
      }
    }
  }

  async callPut(url, body, headers, log = false, forceDisableLog = false) {
    const config = {
      headers: headers,
    }

    try {
      const putPromise = await this.axiosClient.put(url, body, config);
      console.log(`PUT relative URL: ${url}`);
      if (log) {
        console.log(`request body: ${getObjectAsString(body)}`);
        console.log(`response body: ${getObjectAsString(putPromise.data)}`);
      }
      console.log(`RESPONSE status: ${putPromise.status}`);
      if (this.debugLogging) {
        logToFile(`PUT relative url: ${url}`)
        if (!forceDisableLog) {
          logToFile(`request body: ${getObjectAsString(body)}`);
          logToFile(`RESPONSE status: ${putPromise.status}`);
        }

        if (!forceDisableLog) {
          logToFile(`response body: ${getObjectAsString(putPromise.data)}`);
        }
      }
    } catch (error) {
      console.log(`PUT relative url: ${url}`)
      if (log) {
        console.log(`request body: ${getObjectAsString(body)}`)
      }
      if (error.response) {
        console.error(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`)
      } else if (error.data) {
        console.error((error.data) ? error.data : error.response.data)
      } else {
        console.error(error)
      }
      if (this.debugLogging) {
        logToFile(`PUT relative url: ${url}`)
        if (!forceDisableLog) {
          logToFile(`request body: ${getObjectAsString(body)}`)
        }
        if (error.response) {
          logToFile(`RESPONSE ERROR: ${error.response.status} ${error.response.statusText}`)
        }
      }
    }
  }
}

module.exports = {
  HttpClient,
  jsonHeaders,
  imageHeaders,
  multipartDataHeaders
}