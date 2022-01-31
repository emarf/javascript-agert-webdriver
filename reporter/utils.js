import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { testrailLabels, xrayLabels, zephyrLabels } from './constants';

const getBrowserCapabilities = (suiteStats) => ({
  "browserName": suiteStats.capabilities.browserName,
  "browserVersion": suiteStats.capabilities.browserVersion,
  "platformName": suiteStats.capabilities.platformName
})

function logObject(obj) {
  console.log(JSON.stringify(obj, null, 2))
}

function getObjectAsString(obj) {
  return JSON.stringify(obj, null, 2)
}

const parseDate = (date) => {
  const parseDate = new Date(`${date}`);
  const seconds = _addZero(parseDate.getSeconds());
  const minutes = _addZero(parseDate.getMinutes());
  const hours = _addZero(parseDate.getHours());
  const day = _addZero(parseDate.getDate());
  const month = _addZero(parseDate.getMonth() + 1);
  const year = parseDate.getFullYear();

  return `[${hours}:${minutes}:${seconds} ${year}-${month}-${day}]`
}

const _addZero = (value) => {
  return value < 10 ? `0${value}` : value;
};

const getTestArtifacts = (attach) => {
  const array = attach.reduce((acc, el) => [...acc, { fileName: el[0], filePath: el[1] }], []);
  return array.map((item) => {
    const filePath = path.join(__dirname, item.filePath, item.fileName);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    return formData;
  });
}

const getArtifactReferences = (references) => {
  const array = references.reduce((acc, el) => [...acc, { name: el[0], value: el[1] }], []);
  return { items: array };
}

const getVideoAttachments = async (title, parent) => {
  const roughlyFileName = `${parent.replaceAll(' ', '-')}--${title.replaceAll(' ', '-')}`;
  const videosFolder = _joinPath(['videos']);
  let videoName;

  fs.readdirSync(videosFolder).forEach((file) => {
    if (file.includes(roughlyFileName)) {
      videoName = file;
    }
  });

  const videoPath = _joinPath(['/videos', videoName]);
  const formData = new FormData();
  const stream = fs.createReadStream(videoPath);

  stream.on('close', () => { fs.rmSync(videoPath) });
  stream.on('error', (err) => console.log(err));
  formData.append('video', stream);
  return { formData, videoPath };
}

const getScreenshotAttachments = (title, parent) => {
  const roughlyFileName = `${parent.replaceAll(' ', '-')}--${title.replaceAll(' ', '-')}`;
  const folder = _joinPath(['videos', 'rawSeleniumVideoGrabs']);
  let screenshotFolder;
  const screenshots = [];
  fs.readdirSync(folder).forEach((file) => {
    if (file.includes(roughlyFileName)) {
      screenshotFolder = file;
    }
  })

  fs.readdirSync(_joinPath(['videos', 'rawSeleniumVideoGrabs', screenshotFolder])).forEach((file) => {
    const bufferImg = fs.readFileSync(_joinPath(['videos', 'rawSeleniumVideoGrabs', screenshotFolder, file]));
    screenshots.push(bufferImg);
  });
  fs.rmSync(_joinPath(['videos', 'rawSeleniumVideoGrabs', screenshotFolder]), { recursive: true });
  return screenshots;
}

const getFileSizeInBytes = (filename) => {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  console.log('size', fileSizeInBytes);
  return fileSizeInBytes;
}

const _joinPath = (filePath) => {
  const paths = [__dirname, ...filePath];
  return path.join(...paths);
}

// !TODO work on tcm config
const parseTcmRunOptions = (data) => {
  const tcmConfig = {
    xray: {
      executionKey: {
        key: xrayLabels.EXECUTION_KEY,
        value: '',
      },
      disableSync: {
        key: xrayLabels.SYNC_ENABLED,
        value: true,
      },
      enableRealTimeSync: {
        key: xrayLabels.SYNC_REAL_TIME,
        value: false,
      },
    },
    testRail: {
      suiteId: {
        key: testrailLabels.SUITE_ID,
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
      milestone:{
        key: testrailLabels.MILESTONE,
        value: '',
      },
      assignee:{
        key: testrailLabels.ASSIGNEE,
        value: '',
      },     
      enableSync: {
        key: testrailLabels.SYNC_ENABLED,
        value: true,
      },
      includeAllTestCasesInNewRun: {
        key: testrailLabels.INCLUDE_ALL,
        value: false,
      },
      enableRealTimeSync: {
        key: testrailLabels.SYNC_REAL_TIME,
        value: false,
      },
    },
    zephyr: {
      testCycleKey: {
        key: zephyrLabels.TEST_CYCLE_KEY,
        value: '',
      },
      jiraProjectKey: {
        key: zephyrLabels.JIRA_PROJECT_KEY,
        value: '',
      },
      enableSync: {
        key: zephyrLabels.SYNC_ENABLED,
        value: true,
      },
      enableRealTimeSync: {
        key: zephyrLabels.SYNC_REAL_TIME,
        value: false,
      },
    },
  };
  data.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      if (key === 'xrayExecutionKey') {
        tcmConfig.xray.executionKey.value = obj[key];
      }
      if (key === 'xrayDisableSync') {
        tcmConfig.xray.disableSync.value = !JSON.parse(`${obj[key]}`);
      }
      if (key === 'xrayEnableRealTimeSync') {
        tcmConfig.xray.enableRealTimeSync.value = JSON.parse(`${obj[key]}`);
      }

      if (key === 'testRailSuiteId') {
        tcmConfig.testRail.suiteId.value = obj[key];
      }
      if (key === 'testRailRunId') {
        tcmConfig.testRail.runId.value = obj[key];
      }
      if(key === 'testRailRunName') {
        tcmConfig.testRail.runName.value = obj[key];
      }
      if(key === 'testRailMilestone') {
        tcmConfig.testRail.milestone.value = obj[key];
      }
      if(key === 'testRailAssignee') {
        tcmConfig.testRail.runName.value = obj[key];
      }
      if(key === 'testRailDisableSync') {
        tcmConfig.testRail.enableSync.value = !JSON.parse(`${obj[key]}`);
      }
      if (key === 'testRailIncludeAll') {
        tcmConfig.testRail.includeAllTestCasesInNewRun.value = JSON.parse(`${obj[key]}`);
      }
      if (key === 'testRailEnableRealTimeSync') {
        tcmConfig.testRail.enableRealTimeSync.value = JSON.parse(`${obj[key]}`);
        tcmConfig.testRail.includeAllTestCasesInNewRun.value = JSON.parse(`${obj[key]}`);
      }

      if (key === 'zephyrTestCycleKey') {
        tcmConfig.zephyr.testCycleKey.value = obj[key];
      }
      if (key === 'zephyrJiraProjectKey') {
        tcmConfig.zephyr.jiraProjectKey.value = obj[key];
      }
      if (key === 'zephyrDisableSync') {
        tcmConfig.zephyr.enableSync.value = !JSON.parse(`${obj[key]}`);
      }
      if (key === 'zephyrEnableRealTimeSync') {
        tcmConfig.zephyr.enableRealTimeSync.value = JSON.parse(`${obj[key]}`);
      }
    })
  })

  Object.keys(tcmConfig).forEach((item) => {
    Object.keys(tcmConfig[item]).forEach((key) => {
      if (tcmConfig[item][key].value === '') {
        delete tcmConfig[item][key];
      }
    })
  })

  if (!tcmConfig.xray?.executionKey?.value) {
    tcmConfig.xray = {};
  }
  if (!tcmConfig.testRail?.suiteId?.value) {
    tcmConfig.testRail = {};
  }
  if (!tcmConfig.zephyr?.jiraProjectKey?.value || !tcmConfig.zephyr?.testCycleKey?.value) {
    tcmConfig.zephyr = {};
  }
  return tcmConfig;
}

const parseTcmTestOptions = (data, tcmConfig) => {
  const filterTcm = data.filter((el) => {
    if (el.xrayTestKey) {
      if (tcmConfig.xray?.executionKey?.value) {
        return !!el.xrayTestKey.length;
      }
    }
    if (el.testRailCaseId) {
      if (tcmConfig.testRail?.suiteId?.value) {
        return !!el.testRailCaseId.length;
      }
    }
    if (el.zephyrTestCaseKey) {
      if (tcmConfig.zephyr?.jiraProjectKey?.value && tcmConfig.zephyr?.testCycleKey?.value) {
        return !!el.zephyrTestCaseKey.length;
      }
    }
  })
  return filterTcm.map((option) => {
    if (option.xrayTestKey) {
      return option.xrayTestKey.map((value) => {
        return {
          key: xrayLabels.TEST_KEY,
          value,
        }
      })
    }
    if (option.testRailCaseId) {
      return option.testRailCaseId.map((value) => {
        return {
          key: testrailLabels.CASE_ID,
          value,
        }
      })
    }
    if (option.zephyrTestCaseKey) {
      return option.zephyrTestCaseKey.map((value) => {
        return {
          key: zephyrLabels.TEST_CASE_KEY,
          value,
        }
      })
    }
  }).flat();
};


export {
  logObject,
  getObjectAsString,
  parseDate,
  getBrowserCapabilities,
  getTestArtifacts,
  getArtifactReferences,
  getVideoAttachments,
  getScreenshotAttachments,
  getFileSizeInBytes,
  parseTcmRunOptions,
  parseTcmTestOptions,
}