import { expect, test } from '@playwright/test';

test.describe('real Docker stack', () => {
  test('connects to the backend health endpoint and completes staff authentication', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('Backend: healthy');

    await page.goto('/login');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Incorrect username or password')).toBeVisible();

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Operations Overview')).toBeVisible();

    // Reloading forces the protected route to validate the persisted token via /auth/me.
    await page.reload();
    await expect(page.getByText('Operations Overview')).toBeVisible();
    await expect(page.getByText('admin')).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
