import { zephyrLabels } from "../constants";

export default class Zephyr {
  constructor() {
    this.zephyrConfig = {
      testCycleKey: {
        key: zephyrLabels.TEST_CYCLE_KEY,
        value: '',
      },
      jiraProjectKey: {
        key: zephyrLabels.JIRA_PROJECT_KEY,
        value: '',
      },
      testCaseKey: {
        key: zephyrLabels.TEST_CASE_KEY,
        value: '',
      },
      enableSync: {
        key: zephyrLabels.SYNC_ENABLED,
        value: 'true',
      },
      enableRealTimeSync: {
        key: zephyrLabels.SYNC_REAL_TIME,
        value: 'false',
      },
    }
  }

  setTestCycleKey(value) {
    this.zephyrConfig.testCycleKey = { ...this.zephyrConfig.testCycleKey, value };
  }
  setJiraProjectKey(value) {
    this.zephyrConfig.jiraProjectKey = { ...this.zephyrConfig.jiraProjectKey, value };
  }
  setTestCaseKey(value) {
    this.zephyrConfig.testCaseKey = { ...this.zephyrConfig.testCaseKey, value };
  }
  disableSync() {
    this.zephyrConfig.enableSync = { ...this.zephyrConfig.enableSync, value: 'false' };
  }
  enableRealTimeSync() {
    this.zephyrConfig.enableRealTimeSync = { ...this.zephyrConfig.enableRealTimeSync, value: 'true' }
  }
  getZephyrConfig() {
    const obj = JSON.parse(JSON.stringify(this.zephyrConfig));
    this.zephyrConfig.testCaseKey.value = '';
    return obj;
  }
}