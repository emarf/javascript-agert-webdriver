export default class Artifacts {
  constructor() {
    this.artifactAttachments = {
      attachToTestRun: '',
      attachReferenceToTestRun: '',
      attachToTest: '',
      attachReferenceToTest: '',
    };
  };

  attachToTestRun(fileName, filePath) {
    this.artifactAttachments.attachToTestRun = { fileName, filePath }
  }
  attachToTest(fileName, filePath) {
    this.artifactAttachments.attachToTest = { fileName, filePath }
  }
  attachReferenceToTestRun(name, url) {
    this.artifactAttachments.attachReferenceToTestRun = { name, url }
  }
  attachReferenceToTest(name, url) {
    this.artifactAttachments.attachReferenceToTest = { name, url }
  }
  getRunAttachments() {
    return {
      attachToTestRun: this.artifactAttachments.attachToTestRun,
      attachReferenceToTestRun: this.artifactAttachments.attachReferenceToTestRun,
    };
  }
  getTestAttachments() {
    return {
      attachToTest: this.artifactAttachments.attachToTest,
      attachReferenceToTest: this.artifactAttachments.attachReferenceToTest,
    };
  }
}