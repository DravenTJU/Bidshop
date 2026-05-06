import { expect } from '@playwright/test';
import { When, Then } from './fixtures';

When('the name input field receives focus', async ({ checkoutPage }) => {
  await checkoutPage.nameField.focus();
});

Then('the submit button remains visible on screen', async ({ page }) => {
  const submitBtn = page.getByTestId('checkout-submit');
  await expect(submitBtn).toBeVisible();
  const box = await submitBtn.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
});
