import { emitterCommands } from "./constants";

export const reporterEmitter = {
  setMaintainer: (maintainer) => {
    process.emit(emitterCommands.SET_MAINTAINER, maintainer)
  },
  setRunLabels: (labels) => {
    process.emit(emitterCommands.SET_RUN_LABELS, labels)
  },
  setTestLabels: (labels) => {
    process.emit(emitterCommands.SET_TEST_LABELS, labels)
  },
  setRunTcmOptions: (options) => {
    process.emit(emitterCommands.SET_RUN_TCM_OPTIONS, options);
  },
  setTestTcmOptions: (options) => {
    process.emit(emitterCommands.SET_TEST_TCM_OPTIONS, options);
  },
  attachToTestRun: (attachments) => {
    process.emit(emitterCommands.ATTACH_TO_TEST_RUN, attachments);
  },
  attachReferenceToTestRun: (references) => {
    process.emit(emitterCommands.ATTACH_REF_TO_TEST_RUN, references);
  },
  attachToTest: (attachments) => {
    process.emit(emitterCommands.ATTACH_TO_TEST, attachments);
  },
  attachReferenceToTest: (references) => {
    process.emit(emitterCommands.ATTACH_REF_TO_TEST, references);
  },
  // setTestLogs: (logs, level = 'info') => {
  //   process.emit(emitterCommands.SET_TEST_LOGS, logs, level)
  // },
  revertTestRegistration: () => {
    process.emit(emitterCommands.REVERT_TEST_REGISTRATION, true);
  },
};