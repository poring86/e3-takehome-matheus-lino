# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/dashboard-flicker.spec.ts >> Dashboard Flicker >> Loader cobre toda a tela até dados carregarem
- Location: tests/e2e/dashboard-flicker.spec.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Loading')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Loading')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - img [ref=e3]
  - button "Open Next.js Dev Tools" [ref=e10] [cursor=pointer]:
    - img [ref=e11]
  - alert [ref=e14]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Ajuste a URL base conforme necessário
  4  | const DASHBOARD_URL = 'http://localhost:3000/dashboard';
  5  | 
  6  | test.describe('Dashboard Flicker', () => {
  7  |   test('Loader cobre toda a tela até dados carregarem', async ({ page }) => {
  8  |     // Simula usuário autenticado (ajuste conforme seu fluxo de login)
  9  |     // await page.goto('http://localhost:3000/auth/signin');
  10 |     // await page.fill('input[type=email]', 'user@email.com');
  11 |     // await page.fill('input[type=password]', 'senha');
  12 |     // await page.click('button[type=submit]');
  13 |     // await page.waitForURL(DASHBOARD_URL);
  14 | 
  15 |     // Ou acesse direto se já estiver autenticado
  16 |     await page.goto(DASHBOARD_URL);
  17 | 
  18 |     // O loader deve aparecer imediatamente
> 19 |     await expect(page.locator('text=Loading')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  20 | 
  21 |     // O loader deve sumir só quando dashboard ou onboarding aparecer
  22 |     await expect(
  23 |       page.locator('text=Loading')
  24 |     ).not.toBeVisible({ timeout: 10000 });
  25 | 
  26 |     // Não pode aparecer "Welcome!" (onboarding) antes do loader sumir
  27 |     const onboarding = page.locator('text=Welcome!');
  28 |     await expect(onboarding).not.toBeVisible();
  29 | 
  30 |     // Não pode aparecer "Team Notes" antes do loader sumir
  31 |     const dashboard = page.locator('text=Team Notes');
  32 |     await expect(dashboard).not.toBeVisible();
  33 | 
  34 |     // Aguarda o dashboard ou onboarding aparecer
  35 |     await expect(
  36 |       page.locator('text=Welcome!').or(page.locator('text=Team Notes'))
  37 |     ).toBeVisible({ timeout: 10000 });
  38 |   });
  39 | });
  40 | 
```