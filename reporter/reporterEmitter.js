export const reporterEmitter = {
  setMaintainer: (maintainer) => {
    process.emit('SET_MAINTAINER', maintainer)
  },
  setRunArtifactAttachments: (runArtifacts) => {
    process.emit('SET_RUN_ARTIFACTS', runArtifacts)
  },
  setTestArtifactAttachments: (testArtifacts) => {
    process.emit('SET_TEST_ARTIFACTS', testArtifacts)
  },
  setTestrailConfig: (testRailConfig) => {
    process.emit('SET_TESTRAIL_CONFIG', testRailConfig);
  },
  setXrayConfig: (xrayConfig) => {
    process.emit('SET_XRAY_CONFIG', xrayConfig)
  },
  setZephyrConfig: (zephyrConfig) => {
    process.emit('SET_ZEPHYR_CONFIG', zephyrConfig)
  },
  setRunLabels: (labels) => {
    process.emit('SET_RUN_LABELS', labels)
  },
  setTestLabels: (labels) => {
    process.emit('SET_TEST_LABELS', labels)
  },
  setTestLogs: (logs) => {
    process.emit('SET_TEST_LOGS', logs)
  },
  revertTestRegistration: () => {
    process.emit('REVERT_TEST_REGISTRATION',)
  },
}