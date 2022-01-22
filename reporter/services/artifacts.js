export default class Artifacts {
  constructor() {
    this.artifactAttachments = {
      attachToTestRun: [],
      attachReferenceToTestRun: [],
      attachToTest: [],
      attachReferenceToTest: [],
    };
  };

  attachToTestRun(attachRun) {
    this.artifactAttachments.attachToTestRun.push(attachRun);
  }
  attachToTest(attachTest) {
    this.artifactAttachments.attachToTest.push(attachTest);
  }
  attachReferenceToTestRun(attachRefRun) {
    this.artifactAttachments.attachReferenceToTestRun.push(attachRefRun);
  }
  attachReferenceToTest(attachRefTest) {
    this.artifactAttachments.attachReferenceToTest.push(attachRefTest);
  }
  getRunAttachments() {
    const obj = {
      attachToTestRun: this.artifactAttachments.attachToTestRun,
      attachReferenceToTestRun: this.artifactAttachments.attachReferenceToTestRun,
    };
    this.artifactAttachments.attachToTestRun = [];
    this.artifactAttachments.attachReferenceToTestRun = [];
    return obj;
  }
  getTestAttachments() {
    const obj = {
      attachToTest: this.artifactAttachments.attachToTest,
      attachReferenceToTest: this.artifactAttachments.attachReferenceToTest,
    }
    this.artifactAttachments.attachToTest = [];
    this.artifactAttachments.attachReferenceToTest = [];
    return obj;
  }
}