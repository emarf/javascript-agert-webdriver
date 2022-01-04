# Zebrunner Webdriver agent
## Tracking of test results

The valid configuration must be provided.

Open `wdio.conf.js` and edit config
```js
import ZebrunnerReporter from './reporter/reporter';
require('dotenv').config();

const config = {
  "reportingServerHostname": "<YOUR_ZEBRUNNER_SERVER_URL>",
  "reportingServerAccessToken": "<YOUR_ZEBRUNNER_ACCESS_TOKEN>",
  "reportingProjectKey": "DEF",
  "reportingRunEnvironment": "STAGE",
  "reportingRunBuild": "1.0-alpha",
  "reportingRunDisplayName": "My regression suite",
  "reportingRunLocale": "en_US",
  "reportingSlackChannels": "",
  "reportingEmailRecipients": "",
}

module.export = {
  reporters: [
    [ZebrunnerReporter, config],
  ]
}
```

also you can set config params through environment variables

```js
REPORTING_SERVER_HOSTNAME='<YOUR_ZEBRUNNER_SERVER_URL>'
REPORTING_SERVER_ACCESS_TOKEN='<YOUR_ZEBRUNNER_ACCESS_TOKEN>'
REPORTING_PROJECT_KEY='DEF'
REPORTING_RUN_ENVIRONMENT='STAGE'
REPORTING_RUN_BUILD='1.0-alpha'
REPORTING_RUN_DISPLAY_NAME='My regression suite'
REPORTING_SLACK_CHANNELS=''
REPORTING_EMAIL_RECIPIENTS=''
```

Here's the summary of configuration parameters recognized by the agent:

- `reportingServerHostname` - Zebrunner server hostname. It can be obtained in Zebrunner on the Account & Profile page under the Service URL section
- `reportingServerAccessToken` - access token must be used to perform API calls. It can be obtained in Zebrunner on the Account & Profile page under the Token section
- `reportingProjectKey` the project that the test run belongs to. Project must exist in Zebrunner. The default value is DEF. You can manage projects in Zebrunner in the appropriate section
- `reportingRunEnvironment` (optional) - tested environment. Appropriate test run label will be used for test run, if specified
reportingRunBuild (optional) - build number that is associated with the test run. It can depict either the test build number or the application build number
- `reportingRunDisplayName` (optional) - display name of the test run
- `reportingRunLocale` (optional) - locale, that will be displayed for the run in Zebrunner if specified
- `reportingSlackChannels` (optional) - comma separated list of slack channels for notifications
reportingEmailRecipients (optional) - comma separated list of recipients for email notifications
## Collecting test logs
It is also possible to enable the log collection for your tests. 

```js
import Logger from '../../reporter/services/logger';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const logger = new Logger();

describe('run describe', () => {
  it('test describe', () => {
    logger.setTestLog('awesome log1');
    logger.setTestLog('awesome log2');
    reporterEmitter.setTestLogs(logger.getTestLogs());
  })
})
```

## Attach video and screenshots
First you need additional library `wdio-video-reporter`

`npm i wdio-video-reporter`
or 
`yarn add wdio-video-reporter`

then add video-reporter to `wdio.conf.js`

```js
import ZebrunnerReporter from './reporter/reporter';
const video = require('wdio-video-reporter');

module.exports = {
  reporters: [
    [video, {
      saveAllVideos: true,
      videoSlowdownMultiplier: 3,
      outputDir: 'reporter/videos',
    }],
    [ZebrunnerReporter, config],
  ]
}
```
All screenshots and video will attach to the desired test

## Collecting additional artifacts
In case your tests or entire test run produce some artifacts, it may be useful to track them in Zebrunner. The agent comes with a few convenient methods for uploading artifacts in Zebrunner and linking them to the currently running test or the test run.

Artifacts can be uploaded using the `Artifact` class.

`Artifacts` class methods:
- The `attachToTestRun(name, filePath)` and `attachToTest(name, filePath)` methods can be used to upload and attach an artifact file to test run and test respectively.
- The `attachReferenceToTestRun(name, reference)` and `attachReferenceToTest(name, reference)` methods can be used to attach an arbitrary artifact reference to test run and test respectively.

```js
import Artifacts from '../../reporter/services/artifacts';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const artifacts = new Artifacts();

describe('run describe', () => {
  artifacts.attachToTestRun(['awesome name', '/file/path']);
  artifacts.attachReferenceToTestRun(['awesome ref name', 'https://google.com']);
  artifacts.attachReferenceToTestRun(['awesome ref name', 'https://zebrunner.com']);
  reporterEmitter.setRunArtifactAttachments(artifacts.getRunAttachments());

  it('test describe', () => {
    artifacts.attachToTest(['awesome name', '/file/path'])
    artifacts.attachToTest(['awesome name', '/file/path'])
    artifacts.attachReferenceToTest(['awesome name', 'https://github.com']);
    artifacts.attachReferenceToTest(['awesome name', 'https://www.youtube.com']);
    reporterEmitter.setTestArtifactAttachments(artifacts.getTestAttachments());
  })
})
```

### Tracking test maintainer
You may want to add transparency to the process of automation maintenance by having an engineer responsible for evolution of specific tests or test classes. Zebrunner comes with a concept of a maintainer - a person that can be assigned to maintain tests. In order to keep track of those, the agent comes with the `setMaintainer` method.

```js
import { reporterEmitter } from '../../reporter/reporterEmitter';

describe('run describe', () => {

  it('test describe', () => {
    reporterEmitter.setMaintainer('emarf');
  })

  it('another test describe', () => {
    reporterEmitter.setMaintainer('simple');
  })

})
```
In the example above, `emarf` will be reported as a maintainer of `test describe`, while `simple` will be reported as a maintainer of test `another test describe`.

The maintainer username should be a valid Zebrunner username, otherwise it will be set to `anonymous`.

## Attaching labels
In some cases, it may be useful to attach some meta information related to a test.

Labels can be uploaded using the `Labels` class.

`Labels` class methods: 
- `setRunLabel([name, desc])` attached labels for run
- `setTestLabel([name, desc])` attached labels for test

```js
import Labels from '../../reporter/services/labels';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const label = new Labels();

describe('run describe', () => {
  label.setRunLabel(['awesome name', 'desc']);
  label.setRunLabel(['awesome name1', 'desc1']);
  reporterEmitter.setRunLabels(label.getRunLabels());

  it('test describe', () => {
    label.setTestLabel(['awesome name', 'desc']);
    reporterEmitter.setTestLabels(label.getTestLabels());
  })

  it('another test describe', () => {
    label.setTestLabel(['awesome name', 'desc']);
    label.setTestLabel(['awesome name1', 'desc1']);
    reporterEmitter.setTestLabels(label.getTestLabels());
  })
})
```
The values of attached labels will be displayed in Zebrunner under the name of a corresponding test or run.

## Reverting test registration

In some cases it might be handy not to register test execution in Zebrunner. This may be caused by very special circumstances of test environment or execution conditions.

You can use `revertTestRegistration` method for managing test registration at runtime.

```js
import { reporterEmitter } from '../../reporter/reporterEmitter';

describe('run describe', () => {

  it('test describe', () => {
    reporterEmitter.revertTestRegistration();
    // ...some test code
  })
})
```
It is worth mentioning that the method invocation does not affect the test execution, but simply unregisters the test in Zebrunner.

## Setting Test Run locale

You can add `reportingRunLocale` to `wdio.conf.js` config

```js
import ZebrunnerReporter from './reporter/reporter';
require('dotenv').config();

const config = {
  "reportingRunLocale": "en_US",
}

module.export = {
  reporters: [
    [ZebrunnerReporter, config],
  ]
}
```
## Upload test results to external test case management systems

Zebrunner provides an ability to upload test results to external TCMs on test run finish. For some TCMs it is possible to upload results in real-time during the test run execution.

Currently, Zebrunner supports `TestRail`, `Xray`, `Zephyr Squad` and `Zephyr Scale` test case management systems.

### Testrail

For successful upload of test run results in `TestRail`, two steps must be performed:

- Integration with `TestRail` is configured and enabled for Zebrunner project;
- Configuration is performed on the tests side.

### Configuration
Zebrunner agent has a special `TestRail` class with a bunch of methods to control results upload:

- `setSuiteId(value)` - mandatory. The method sets TestRail suite id for current test run. This method must be invoked before all tests. Thus, it should be invoked from `before` method.
- `setCaseId(value)` - mandatory. Using these mechanisms you can set TestRail's case associated with specific automated test.
- `disableSync()` - optional. Disables result upload. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `includeAllTestCasesInNewRun()` - optional. Includes all cases from suite into newly created run in TestRail. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `enableRealTimeSync()` - optional. Enables real-time results upload. In this mode, result of test execution will be uploaded immediately after test finish. This method also automatically invokes `includeAllTestCasesInNewRun()`. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `setRunId(value)` - optional. Adds result into existing TestRail run. If not provided, test run is treated as new. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `setRunName(value)` - optional. Sets custom name for new TestRail run. By default, Zebrunner test run name is used. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `setMilestone(value)` - optional. Adds result in TestRail milestone with the given name. Same as `setSuiteId(value)`, this method must be invoked before all tests;
- `setAssignee(value)` - optional. Sets TestRail run assignee. Same as `setSuiteId(value)`, this method must be invoked before all tests.

By default, a new run containing only cases assigned to the tests will be created in `TestRail` on test run finish.

```js 
import Testrail from '../../reporter/services/testrail';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const testrail = new Testrail();

describe('run describe', () => {
  before(() => {
    testrail.setSuiteId('suite id');
    testrail.setAssignee('assignee');
    testrail.setMilestone('milestone');
    testrail.setRunName('run name');
    testrail.setRunId('run id');
  })
  it('test describe', () => {
    testrail.setCaseId(['case id1', 'case id2']);
    reporterEmitter.setTestrailConfig(testrail.getTestrailConfig());
  })
})
```

### Xray

For successful upload of test run results in `Xray` two steps must be performed:

- `Xray` integration is configured and enabled in Zebrunner project
- `Xray` configuration is performed on the tests side

### Configuration

Zebrunner agent has a special `Xray` class with a bunch of methods to control results upload:

- `setExecutionKey(value)` - mandatory. The method sets Xray execution key. This method must be invoked before all tests. Thus, it should be invoked from `before` method.
- `setTestKey(String)` - mandatory. Using these mechanisms you can set test keys associated with specific automated test.
- `disableSync()` - optional. Disables result upload. Same as `setExecutionKey(value)`, this method must be invoked before all tests;
- `enableRealTimeSync()` - optional. Enables real-time results upload. In this mode, result of test execution will be uploaded immediately after test finish. Same as `setExecutionKey(value)`, this method must be invoked before all tests.

By default, results will be uploaded to `Xray` on test run finish.

```js 
import Xray from '../../reporter/services/xray';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const xray = new Xray();

describe('run describe', () => {
  before(() => {
    xray.setExecutionKey('execution key');
  })
  it('test describe', () => {
    xray.setTestKey(['test key 1', 'test key 2']);
    reporterEmitter.setXrayConfig(xray.getXrayConfig());
  })
})
```
### Zephyr Squad & Zephyr Scale

For successful upload of test run results in `Zephyr` two steps must be performed:

- `Zephyr` integration is configured and enabled in Zebrunner project
- `Zephyr` configuration is performed on the tests side

### Configuration

Zebrunner agent has a special `Zephyr` class with a bunch of methods to control results upload:

- `setTestCycleKey(value)` - mandatory. The method sets Zephyr test cycle key. This method must be invoked before all tests. Thus, it should be invoked from `before` method.
- `setJiraProjectKey(value)` - mandatory. Sets Zephyr Jira project key. Same as `setTestCycleKey(value)`, this method must be invoked before all tests;
- `setTestCaseKey(value)` - mandatory. Using these mechanisms you can set test case keys associated with specific automated test.
- `disableSync()` - optional. Disables result upload. Same as `setTestCycleKey(value)`, this method must be invoked before all tests;
- `enableRealTimeSync()` - optional. Enables real-time results upload. In this mode, result of test execution will be uploaded immediately after test finish. Same as `setTestCycleKey(value)`, this method must be invoked before all tests.

```js
import Zephyr from '../../reporter/services/zephyr';
import { reporterEmitter } from '../../reporter/reporterEmitter';

const zephyr = new Zephyr();

describe('run describe', () => {
  before(() => {
    zephyr.setTestCycleKey('cycle key');
    zephyr.setJiraProjectKey('project key');
  })
  it('test describe', () => {
    zephyr.setTestCaseKey(['test case key1', 'test case key']);
    reporterEmitter.setZephyrConfig(zephyr.getZephyrConfig());
  })
})
```