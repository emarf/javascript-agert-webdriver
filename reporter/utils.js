const glob = require('glob');
const fs = require('fs');


function logObject(obj) {
  console.log(JSON.stringify(obj, null, 2))
}

function getObjectAsString(obj) {
  return JSON.stringify(obj, null, 2)
}


function getFailedScreenshot(screenshotFileBaseName, retries) {
  return new Promise(resolve => {
    var filesAll = []
    const testName = screenshotFileBaseName.replace(/[",:,<,>]/g, '');
    filesAll = filesAll.concat(glob.sync(`**/${testName} (failed).png`))
    for (var i = 1; i <= retries; i++) {
      filesAll = filesAll.concat(glob.sync(`**/${testName} (failed) (attempt ${i + 1}).png`))
    }
    resolve(filesAll);
  });
};

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

function writeJsonToFile(folderName, fileName, obj) {
  fs.mkdir(folderName, { recursive: true }, (err) => {
    if (err) throw err;
    fs.writeFile(`${folderName}/${fileName}`, JSON.stringify(obj, null, 4), 'utf8', function (err) {
      if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
      }
      console.log(`JSON file ${fileName} has been saved.`);
    });
  });
}

function logToFile(msg) {
  fs.appendFileSync('cypress/zbr-report/worker.log', `${new Date().toISOString()} - ${msg}\n`)
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

module.exports = {
  logObject,
  getObjectAsString,
  getFailedScreenshot,
  getFilesizeInBytes,
  writeJsonToFile,
  sleep,
  logToFile,
  parseDate,
}