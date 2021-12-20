describe('Ebay Product Search', () => {
  it('should open the main url and verify title', async () => {
    await browser.url(`https://www.ebay.com`);
    await expect(browser).toHaveTitle('Электроника, автомобили, мода, коллекционирование, купоны и другие товары | eBay');

    const searchInput = $('#gh-ac');
    const searchBtn = $('#gh-btn');

    await searchInput.addValue('Laptop');
    await searchBtn.click();

    await expect(searchInput).toHaveValue('laptop');

    await expect(browser).toHaveTitle('laptop | eBay');


    const category = $('#gh-cat option:nth-child(1)');
    await expect(category).toHaveText('Ноутбуки и нетбуки PC');
  });
})

