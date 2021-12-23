describe('Webdriverio main page', () => {
  it('should be right title', async () => {
    await browser.setOwner('emarf');
    await browser.setTestrailTestCaseId(['case_id_1', 'case_id_2']);
    await browser.setXrayTestKey(['test_keys1', 'test_keys2']);
    await browser.url(`https://webdriver.io`);
    await browser.takeScreenshot();
    await expect(browser).toHaveTitle('WebdriverIO · Next-ge browser and mobile automation test framework for Node.js | WebdriverIO');
  });
});
