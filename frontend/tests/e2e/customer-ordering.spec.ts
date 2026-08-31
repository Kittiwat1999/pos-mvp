import { expect, test } from '@playwright/test';

test.describe('customer QR ordering', () => {
  test('scans a QR session, adds a product, and submits an order round', async ({ page }) => {
    await page.route('**/api/v1/qr/demo-token', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          session_id: 'session-1',
          table_id: 'table-1',
          table_name: 'T-01',
          status: 'OPEN',
        }),
      });
    });

    await page.route('**/api/v1/products?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'product-1',
            category_id: 'category-1',
            name: 'Pad Kra Pao',
            description: 'Basil pork with rice',
            price: 60,
            active: true,
          },
        ]),
      });
    });

    let submittedPayload: unknown;
    await page.route('**/api/v1/table-sessions/session-1/orders', async (route) => {
      submittedPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'order-1',
          table_session_id: 'session-1',
          status: 'PENDING',
          subtotal: 60,
          discount: 0,
          tax: 0,
          total: 60,
          created_at: '2026-08-29T10:00:00Z',
          items: [],
        }),
      });
    });

    await page.goto('/order/demo-token');
    await expect(page.getByText('QR session active')).toBeVisible();
    await expect(page.getByText('Pad Kra Pao')).toBeVisible();

    await page.getByRole('button', { name: 'Add to order' }).click();
    await expect(page.getByText('฿60.00', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Note (optional)').fill('Less spicy');
    await page.getByRole('button', { name: 'Confirm order' }).click();

    await expect(page.getByText('Order submitted successfully.')).toBeVisible();
    expect(submittedPayload).toEqual({
      items: [{ product_id: 'product-1', quantity: 1, note: 'Less spicy' }],
    });
  });

  test('rejects a closed QR session', async ({ page }) => {
    await page.route('**/api/v1/qr/closed-token', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'session-closed', table_id: 'table-1', status: 'CLOSED' }),
      });
    });

    await page.goto('/order/closed-token');
    await expect(page.getByText('This QR session is closed.')).toBeVisible();
  });
});
