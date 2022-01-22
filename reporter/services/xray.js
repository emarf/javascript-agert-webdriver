import { xrayLabels } from "../constants";

export default class Xray {
  constructor() {
    this.xrayConfig = {
      executionKey: {
        key: xrayLabels.EXECUTION_KEY,
        value: '',
      },
      testKey: {
        key: xrayLabels.TEST_KEY,
        value: '',
      },
      enableSync: {
        key: xrayLabels.SYNC_ENABLED,
        value: 'true',
      },
      enableRealTimeSync: {
        key: xrayLabels.SYNC_REAL_TIME,
        value: 'false',
      },
    }
  }

  setExecutionKey(value) {
    this.xrayConfig.executionKey = { ...this.xrayConfig.executionKey, value };
  }
  setTestKey(value) {
    this.xrayConfig.testKey = { ...this.xrayConfig.testKey, value }
  }
  disableSync() {
    this.xrayConfig.disableSync = { ...this.xrayConfig.disableSync, value: 'false' };
  }
  enableRealTimeSync() {
    this.xrayConfig.enableRealTimeSync = { ...this.xrayConfig.enableRealTimeSync, value: 'true' };
  }
  getXrayConfig() {
    const obj = JSON.parse(JSON.stringify(this.xrayConfig));
    this.xrayConfig.testKey.value = '';
    return obj;
  }
}