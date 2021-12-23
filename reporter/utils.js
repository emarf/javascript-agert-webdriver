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

export {
  logObject,
  getObjectAsString,
  parseDate,
  getBrowserCapabilities,
}