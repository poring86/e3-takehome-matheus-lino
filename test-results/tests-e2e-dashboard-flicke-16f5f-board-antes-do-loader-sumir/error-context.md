# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/dashboard-flicker-visual.spec.ts >> Dashboard Flicker Visual >> Não exibe onboarding ou dashboard antes do loader sumir
- Location: tests/e2e/dashboard-flicker-visual.spec.ts:31:7

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
  2  | import fs from 'fs';
  3  | 
  4  | const DASHBOARD_URL = 'http://localhost:3000/dashboard';
  5  | 
  6  | // Utilitário para contar quantas vezes o loader aparece/desaparece
  7  | async function trackLoaderTransitions(page, testName) {
  8  |   let loaderVisibleCount = 0;
  9  |   let loaderInvisibleCount = 0;
  10 |   let lastVisible = undefined;
  11 |   const screenshots = [];
  12 | 
  13 |   for (let i = 0; i < 30; i++) {
  14 |     const visible = await page.locator('text=Loading').isVisible();
  15 |     if (visible !== lastVisible) {
  16 |       if (visible) {
  17 |         loaderVisibleCount++;
  18 |         screenshots.push(await page.screenshot({ path: `loader-visible-${testName}-${loaderVisibleCount}.png` }));
  19 |       } else {
  20 |         loaderInvisibleCount++;
  21 |         screenshots.push(await page.screenshot({ path: `loader-invisible-${testName}-${loaderInvisibleCount}.png` }));
  22 |       }
  23 |       lastVisible = visible;
  24 |     }
  25 |     await page.waitForTimeout(200); // 200ms entre checks
  26 |   }
  27 |   return { loaderVisibleCount, loaderInvisibleCount, screenshots };
  28 | }
  29 | 
  30 | test.describe('Dashboard Flicker Visual', () => {
  31 |   test('Não exibe onboarding ou dashboard antes do loader sumir', async ({ page }) => {
  32 |     await page.goto(DASHBOARD_URL);
  33 | 
  34 |     // O loader deve aparecer imediatamente
> 35 |     await expect(page.locator('text=Loading')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  36 | 
  37 |     // Enquanto o loader está visível, não pode aparecer onboarding nem dashboard
  38 |     await expect(page.locator('text=Welcome!')).not.toBeVisible();
  39 |     await expect(page.locator('text=Team Notes')).not.toBeVisible();
  40 | 
  41 |     // Aguarda o loader sumir
  42 |     await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 10000 });
  43 | 
  44 |     // Agora sim, deve aparecer onboarding ou dashboard
  45 |     await expect(
  46 |       page.locator('text=Welcome!').or(page.locator('text=Team Notes'))
  47 |     ).toBeVisible({ timeout: 10000 });
  48 |   });
  49 | 
  50 |   test('Não há flicker de onboarding para usuário com organização', async ({ page }) => {
  51 |     // Aqui você pode simular login/mocks se necessário
  52 |     await page.goto(DASHBOARD_URL);
  53 | 
  54 |     // O loader deve aparecer
  55 |     await expect(page.locator('text=Loading')).toBeVisible();
  56 | 
  57 |     // Aguarda o loader sumir
  58 |     await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 10000 });
  59 | 
  60 |     // Se o usuário tem organização, nunca deve aparecer "Welcome!"
  61 |     const onboarding = page.locator('text=Welcome!');
  62 |     expect(await onboarding.isVisible()).toBeFalsy();
  63 |     // O dashboard deve aparecer
  64 |     await expect(page.locator('text=Team Notes')).toBeVisible();
  65 |   });
  66 | 
  67 |   test('Detecta múltiplas transições do loader (flicker)', async ({ page }) => {
  68 |     await page.goto(DASHBOARD_URL);
  69 |     const result = await trackLoaderTransitions(page, 'flicker');
  70 |     // Log detalhado no console
  71 |     console.log('Loader ficou visível', result.loaderVisibleCount, 'vez(es)');
  72 |     console.log('Loader ficou invisível', result.loaderInvisibleCount, 'vez(es)');
  73 |     // Falha se o loader ficou visível mais de uma vez
  74 |     expect(result.loaderVisibleCount).toBeLessThanOrEqual(1);
  75 |     expect(result.loaderInvisibleCount).toBeLessThanOrEqual(1);
  76 |     // Salva relatório
  77 |     fs.writeFileSync('loader-transitions-report.json', JSON.stringify(result, null, 2));
  78 |   });
  79 | });
  80 | 
```