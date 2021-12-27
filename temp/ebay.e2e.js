describe('Ebay Product Search', () => {
  it('should open the main url and verify title', async () => {
    await browser.setOwner('emarf');
    await browser.url(`https://www.ebay.com`);
    await browser.takeScreenshot();
    await expect(browser).toHaveTitle('Электроника, автомобили, мода, коллекционирование, купоны и другие товары | eBay');
    await browser.takeScreenshot();
  });

  it('should add value to input and click', async () => {

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.addValue('Laptop');
    await browser.takeScreenshot();
    await searchBtn.click();

    await expect(searchInput).toHaveValue('laptop');

    await expect(browser).toHaveTitle('laptop | eBay');
    await browser.takeScreenshot();
  });
})

