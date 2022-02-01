export const reporterEmitter = {
  setMaintainer: (maintainer) => {
    process.emit('SET_MAINTAINER', maintainer)
  },
  setRunLabels: (labels) => {
    process.emit('SET_RUN_LABELS', labels)
  },
  setTestLabels: (labels) => {
    process.emit('SET_TEST_LABELS', labels)
  },
  setRunTcmOptions: (options) => {
    process.emit('SET_RUN_TCM_OPTIONS', options);
  },
  setTestTcmOptions: (options) => {
    process.emit('SET_TEST_TCM_OPTIONS', options);
  },
  attachToTestRun: (attachments) => {
    process.emit('ATTACH_TO_TEST_RUN', attachments);
  },
  attachReferenceToTestRun: (references) => {
    process.emit('ATTACH_REF_TO_TEST_RUN', references);
  },
  attachToTest: (attachments) => {
    process.emit('ATTACH_TO_TEST', attachments);
  },
  attachReferenceToTest: (references) => {
    process.emit('ATTACH_REF_TO_TEST', references);
  },
  setTestLogs: (logs) => {
    process.emit('SET_TEST_LOGS', logs)
  },
  revertTestRegistration: () => {
    process.emit('REVERT_TEST_REGISTRATION',)
  },
};