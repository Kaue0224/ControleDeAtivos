import { expect, test } from '@playwright/test';

test('a raiz do app leva ao login quando ninguém está logado', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('.btn-entrar')).toBeVisible();
});
