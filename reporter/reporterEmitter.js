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
  setRunTcmOptions: (options) => {
    process.emit('SET_RUN_TCM_OPTIONS', options);
  },
  setTestTcmOptions: (options) => {
    process.emit('SET_TEST_TCM_OPTIONS', options);
  },
};