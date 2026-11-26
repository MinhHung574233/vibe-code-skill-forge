import { expect, test } from '@playwright/test';
import { launchApp } from './helpers';

test('the language can be switched in Settings, applies at once and survives a reload', async ({
  page,
}) => {
  await launchApp(page);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('radio', { name: 'Tiếng Việt' }).click();
  await expect(page.getByRole('heading', { name: 'Cài đặt', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByRole('link', { name: 'Trang chủ', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Cài đặt', level: 1 })).toBeVisible();

  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sf-lang'))).toBe('en');
});

test('Vietnamese covers the modules: Home, Practice, a lesson and a game', async ({ page }) => {
  await launchApp(page);
  await page.evaluate(() => localStorage.setItem('sf-lang', 'vi'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trang chủ', level: 1 })).toBeVisible();

  await page.goto('/#/practice/java/lesson/java-oop-records');
  await expect(
    page.getByRole('heading', { name: 'Class, interface và record', level: 1 }),
  ).toBeVisible();

  await page.goto('/#/practice/chess');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByText('Play the engine')).toHaveCount(0); // translated, not English
});

test('a device set to Vietnamese starts in Vietnamese, and an explicit choice wins', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'vi-VN' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Trang chủ', level: 1 })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('sf-lang', 'en'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  await context.close();
});

test('Vietnamese works offline once the app has loaded', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sf-lang', 'vi'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trang chủ', level: 1 })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.waitForTimeout(3000); // let precaching finish
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trang chủ', level: 1 })).toBeVisible();
  await page.goto('/#/practice/java/lesson/java-oop-records');
  await expect(
    page.getByRole('heading', { name: 'Class, interface và record', level: 1 }),
  ).toBeVisible();
  await context.setOffline(false);
});
