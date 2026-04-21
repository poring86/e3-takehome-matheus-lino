import { test, expect } from "@playwright/test";

// Ajuste a URL base conforme necessário
const DASHBOARD_URL = "http://localhost:3000/dashboard";

test.describe("Dashboard Flicker", () => {
  test("Loader cobre toda a tela até dados carregarem", async ({ page }) => {
    // Simula usuário autenticado (ajuste conforme seu fluxo de login)
    // await page.goto('http://localhost:3000/auth/signin');
    // await page.fill('input[type=email]', 'user@email.com');
    // await page.fill('input[type=password]', 'senha');
    // await page.click('button[type=submit]');
    // await page.waitForURL(DASHBOARD_URL);

    // Ou acesse direto se já estiver autenticado
    await page.goto(DASHBOARD_URL);

    // O loader deve aparecer imediatamente
    await expect(page.locator("text=Loading")).toBeVisible();

    // O loader deve sumir só quando dashboard ou onboarding aparecer
    await expect(page.locator("text=Loading")).not.toBeVisible({
      timeout: 10000,
    });

    // Não pode aparecer "Welcome!" (onboarding) antes do loader sumir
    const onboarding = page.locator("text=Welcome!");
    await expect(onboarding).not.toBeVisible();

    // Não pode aparecer "Team Notes" antes do loader sumir
    const dashboard = page.locator("text=Team Notes");
    await expect(dashboard).not.toBeVisible();

    // Aguarda o dashboard ou onboarding aparecer
    await expect(
      page.locator("text=Welcome!").or(page.locator("text=Team Notes")),
    ).toBeVisible({ timeout: 10000 });
  });
});
