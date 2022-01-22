import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { Console } from 'console';

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
}