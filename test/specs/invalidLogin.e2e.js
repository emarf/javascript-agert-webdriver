describe('My Login application', () => {
  it('should login with invalid credentials', async () => {
    await browser.url(`https://the-internet.herokuapp.com/login`);
    await $('#username').setValue('tomsmith');
    await $('#password').setValue('SuperScretPassword!');
    await $('button[type="submit"]').click();
    await expect($('#flash')).toBeExisting();
    await expect($('#flash')).toHaveTextContaining(
      'Your password is invalid!');
  });
});



