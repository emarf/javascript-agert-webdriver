Open `wdio.conf.js` and edit config
```js
const config = {
  "reportingServerHostname": "<YOUR_ZEBRUNNER_SERVER_URL>",
  "reportingServerAccessToken": "<YOUR_ZEBRUNNER_ACCESS_TOKEN>",
  "reportingProjectKey": "DEF",
  "reportingRunEnvironment": "STAGE",
  "reportingRunBuild": "1.0-alpha",
  "reportingRunDisplayName": "My regression suite1",
  "reportingRunLocale": "en_US",
  "reportingCiRunId": "46190073-55db-4411-ac42-fd42b7c96958",
  "reportingSlackChannels": "",
  "reportingEmailRecipients": "",
  // "reportingTestrailEnabled": "",
  // "reportingTestrailSuiteId": "",
  // "reportingTestrailTestrunName": "",
  // "reportingTestrailTestrunID": "",
  // "reportingTestrailMilestone": "",
  // "reportingTestrailAssignee": "",
  // "reportingTestrailIncludeAll": "",
  // "reportingXrayEnabled": "",
  // "reportingXrayTestExecutionKey": ""
}
```

Here's the summary of configuration parameters recognized by the agent:

- `reportingServerHostname` - Zebrunner server hostname. It can be obtained in Zebrunner on the Account & Profile page under the Service URL section
- `reportingServerAccessToken` - access token must be used to perform API calls. It can be obtained in Zebrunner on the Account & Profile page under the Token section
- `reportingProjectKey` the project that the test run belongs to. Project must exist in Zebrunner. The default value is DEF. You can manage projects in Zebrunner in the appropriate section
- `reportingRunEnvironment` (optional) - tested environment. Appropriate test run label will be used for test run, if specified
reportingRunBuild (optional) - build number that is associated with the test run. It can depict either the test build number or the application build number
- `reportingRunDisplayName` (optional) - display name of the test run
- `reportingRunLocale` (optional) - locale, that will be displayed for the run in Zebrunner if specified
- `reportingCiRunId` (optional) - id of the run on CI. Once specified will be used for registering of new test run in Zebrunner instead of newly generated uuid
- `reportingSlackChannels` (optional) - comma separated list of slack channels for notifications
reportingEmailRecipients (optional) - comma separated list of recipients for email notifications
- `reportingTestrailEnabled` - true of false to enable or disable integration
- `reportingTestrailSuiteId` - ID of suite in TestRail
- `reportingTestrailTestrunName` - (optional) name of existent test run in TestRail
- `reportingTestrailTestrunID` - (optional) ID of existent test run in TestRail
- `reportingTestrailMilestone` - (optional) milestone for the run in TestRail
- `reportingTestrailAssignee` - (optional) assignee for the run in TestRail
reportingTestrailIncludeAll - (optional)
- `reportingXrayEnabled` - true of false to enable or disable integration
- `reportingXrayTestExecutionKey` - execution key obtained at Xray

How to set `owner`, `testtrailCaseId`, `xrayTestId`
```js
describe('Webdriverio main page', () => {
  it('should be right title', async () => {
    await browser.setOwner('emarf');
    await browser.setTestrailTestCaseId(['case_id_1', 'case_id_2']);
    await browser.setXrayTestKey(['test_keys1', 'test_keys2']);
  });
});
```
All options can be set in every test