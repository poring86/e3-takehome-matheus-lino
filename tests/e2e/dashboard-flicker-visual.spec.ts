import { test, expect } from "@playwright/test";
import fs from "fs";
import type { Page } from "@playwright/test";

const DASHBOARD_URL = "http://localhost:3000/dashboard";

// Utilitário para contar quantas vezes o loader aparece/desaparece
async function trackLoaderTransitions(page: Page, testName: string) {
  let loaderVisibleCount = 0;
  let loaderInvisibleCount = 0;
  let lastVisible = undefined;
  const screenshots = [];

  for (let i = 0; i < 30; i++) {
    const visible = await page.locator("text=Loading").isVisible();
    if (visible !== lastVisible) {
      if (visible) {
        loaderVisibleCount++;
        screenshots.push(
          await page.screenshot({
            path: `loader-visible-${testName}-${loaderVisibleCount}.png`,
          }),
        );
      } else {
        loaderInvisibleCount++;
        screenshots.push(
          await page.screenshot({
            path: `loader-invisible-${testName}-${loaderInvisibleCount}.png`,
          }),
        );
      }
      lastVisible = visible;
    }
    await page.waitForTimeout(200); // 200ms entre checks
  }
  return { loaderVisibleCount, loaderInvisibleCount, screenshots };
}

test.describe("Dashboard Flicker Visual", () => {
  test("Não exibe onboarding ou dashboard antes do loader sumir", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    // O loader deve aparecer imediatamente
    await expect(page.locator("text=Loading")).toBeVisible();

    // Enquanto o loader está visível, não pode aparecer onboarding nem dashboard
    await expect(page.locator("text=Welcome!")).not.toBeVisible();
    await expect(page.locator("text=Team Notes")).not.toBeVisible();

    // Aguarda o loader sumir
    await expect(page.locator("text=Loading")).not.toBeVisible({
      timeout: 10000,
    });

    // Agora sim, deve aparecer onboarding ou dashboard
    await expect(
      page.locator("text=Welcome!").or(page.locator("text=Team Notes")),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Não há flicker de onboarding para usuário com organização", async ({
    page,
  }) => {
    // Aqui você pode simular login/mocks se necessário
    await page.goto(DASHBOARD_URL);

    // O loader deve aparecer
    await expect(page.locator("text=Loading")).toBeVisible();

    // Aguarda o loader sumir
    await expect(page.locator("text=Loading")).not.toBeVisible({
      timeout: 10000,
    });

    // Se o usuário tem organização, nunca deve aparecer "Welcome!"
    const onboarding = page.locator("text=Welcome!");
    expect(await onboarding.isVisible()).toBeFalsy();
    // O dashboard deve aparecer
    await expect(page.locator("text=Team Notes")).toBeVisible();
  });

  test("Detecta múltiplas transições do loader (flicker)", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    const result = await trackLoaderTransitions(page, "flicker");
    // Log detalhado no console
    console.log("Loader ficou visível", result.loaderVisibleCount, "vez(es)");
    console.log(
      "Loader ficou invisível",
      result.loaderInvisibleCount,
      "vez(es)",
    );
    // Falha se o loader ficou visível mais de uma vez
    expect(result.loaderVisibleCount).toBeLessThanOrEqual(1);
    expect(result.loaderInvisibleCount).toBeLessThanOrEqual(1);
    // Salva relatório
    fs.writeFileSync(
      "loader-transitions-report.json",
      JSON.stringify(result, null, 2),
    );
  });
});
