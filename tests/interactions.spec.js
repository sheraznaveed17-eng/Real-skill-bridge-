import { test, expect } from '@playwright/test';

test.describe('public visitor interactions', () => {
  test('guest account menu opens and reaches login', async ({ page }) => {
    await page.goto('/');
    const accountButton = page.getByRole('button', { name: 'Login or sign up' });
    await expect(accountButton).toBeVisible();
    await accountButton.click();
    await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible();
    await page.getByRole('button', { name: /Log in/i }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('signup form switches marketplace type and validates required fields', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login or sign up' }).click();
    await page.getByRole('button', { name: /Join Skill Bridge|Create an account/i }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Digital Work/i })).toBeVisible();
    const practical = page.getByRole('button', { name: /Practical Work/i });
    await practical.click();
    await expect(practical).toHaveClass(/selected/);

    const email = page.getByLabel('Email address');
    const password = page.getByLabel('Password');
    await email.fill('not-an-email');
    await password.fill('123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(email).toHaveJSProperty('validity.valid', false);
  });

  test('signup and login modes can be switched without submitting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login or sign up' }).click();
    await page.getByRole('button', { name: /Join Skill Bridge|Create an account/i }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await page.getByRole('button', { name: 'Log in', exact: true }).last().click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await page.getByRole('button', { name: 'Create an account', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('mobile navigation menu opens and closes', async ({ page, isMobile }) => {
    await page.goto('/');
    const openMenu = page.getByRole('button', { name: 'Open navigation' });
    await expect(openMenu).toBeVisible();
    await openMenu.click();
    await expect(page.getByText('Skill Bridge Menu')).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByText('Skill Bridge Menu')).toHaveCount(0);
  });

  test('home search accepts text and clear filters resets marketplace controls', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Search any skill, service or job...');
    await search.fill('logo design');
    await expect(search).toHaveValue('logo design');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(search).toHaveValue('');
  });
});
