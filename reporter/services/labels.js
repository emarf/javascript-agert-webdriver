export default class Labels {
  constructor() {
    this.labelsConfig = {
      runLabels: [],
      testLabels: [],
    };
  };
  setRunLabel(label) {
    const obj = { key: label[0], value: label[1] };
    this.labelsConfig.runLabels.push(obj);
  }
  setTestLabel(label) {
    const obj = { key: label[0], value: label[1] };
    this.labelsConfig.testLabels.push(obj);
  }
  getRunLabels() {
    const obj = JSON.parse(JSON.stringify(this.labelsConfig.runLabels));
    this.labelsConfig.runLabels = [];
    return obj;
  }
  getTestLabels() {
    const obj = JSON.parse(JSON.stringify(this.labelsConfig.testLabels));
    this.labelsConfig.testLabels = [];
    return obj;
  }
}