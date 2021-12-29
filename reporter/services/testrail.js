import { testrailLabels } from "../constants";

export default class Testrail {
  constructor() {
    this.testrailConfig = {
      suiteId: {
        key: testrailLabels.SUITE_ID,
        value: '',
      },
      caseId: {
        key: testrailLabels.CASE_ID,
        value: '',
      },
      runId: {
        key: testrailLabels.RUN_ID,
        value: '',
      },
      runName: {
        key: testrailLabels.RUN_NAME,
        value: '',
      },
      milestone: {
        key: testrailLabels.MILESTONE,
        value: '',
      },
      assignee: {
        key: testrailLabels.ASSIGNEE,
        value: '',
      },
      enableSync: {
        key: testrailLabels.SYNC_ENABLED,
        value: 'true',
      },
      includeAllTestCasesInNewRun: {
        key: testrailLabels.INCLUDE_ALL,
        value: 'false',
      },
      enableRealTimeSync: {
        key: testrailLabels.SYNC_REAL_TIME,
        value: 'false',
      },
    };
  }

  setSuiteId(value) {
    this.testrailConfig.suiteId = { ...this.testrailConfig.suiteId, value };
  }

  setCaseId(value) {
    this.testrailConfig.caseId = { ...this.testrailConfig.caseId, value };
  }
  disableSync() {
    this.testrailConfig.disableSync.value = 'false';
  }
  includeAllTestCasesInNewRun() {
    this.testrailConfig.includeAllTestCasesInNewRun.value = 'true';
  }
  enableRealTimeSync() {
    this.testrailConfig.enableRealTimeSync.value = 'true';
  }
  setRunId(value) {
    this.testrailConfig.runId = { ...this.testrailConfig.caseId, value };
  }
  setRunName(value) {
    this.testrailConfig.runName = { ...this.testrailConfig.runName, value };
  }
  setMilestone(value) {
    this.testrailConfig.milestone = { ...this.testrailConfig.milestone, value };
  }
  setAssignee(value) {
    this.testrailConfig.assignee = { ...this.testrailConfig.assignee, value };
  }
  getTestrailConfig() {
    const obj = JSON.parse(JSON.stringify(this.testrailConfig));
    this.testrailConfig.caseId.value = '';
    return obj;
  }
}