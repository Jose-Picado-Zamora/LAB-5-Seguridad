const { test, expect } = require('@playwright/test');

test.describe('Pruebas End-to-End UNA Chat con Playwright', () => {

  test.beforeEach(async ({ page }) => {
    // Abrir la página del chat
    await page.goto('/');
  });

  test('Caso 1: Enviar URL de imagen y verificar que la imagen se muestra en el chat', async ({ page }) => {
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png';

    // Rellenar usuario y URL de la imagen
    await page.fill('#nombre', 'JoseTester');
    await page.fill('#m', imageUrl);
    await page.click('button:has-text("Send")');

    // Localizador de la imagen renderizada
    const imageLocator = page.locator('#messages img').first();
    await expect(imageLocator).toBeVisible({ timeout: 10000 });
    await expect(imageLocator).toHaveAttribute('src', imageUrl);
  });

  test('Caso 2: Enviar URL de video y verificar que el reproductor <iframe> aparece', async ({ page }) => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    await page.fill('#nombre', 'JoseTester');
    await page.fill('#m', videoUrl);
    await page.click('button:has-text("Send")');

    // Localizador del iframe reproductor de video
    const iframeLocator = page.locator('#messages iframe').first();
    await expect(iframeLocator).toBeVisible({ timeout: 10000 });
    await expect(iframeLocator).toHaveAttribute('src', /https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);
  });

  test('Caso 3: Prevenir Script Injection (detectar alert y verificar saneamiento)', async ({ page }) => {
    let alertTriggered = false;

    // Registrar listener de diálogos antes del envío: si salta un alert, la prueba fallará
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const scriptMalicioso = "<script>alert('Inyección de script');</script>";

    await page.fill('#nombre', 'Atacante');
    await page.fill('#m', scriptMalicioso);
    await page.click('button:has-text("Send")');

    // Esperar a que el mensaje se procese
    await page.waitForTimeout(1500);

    // 1. Confirmar que ningún alert se ejecutó
    expect(alertTriggered).toBe(false);

    // 2. Confirmar que el contenido fue saneado y aparece en el chat como texto inofensivo
    const messages = page.locator('#messages');
    await expect(messages).toContainText(scriptMalicioso);
  });

});
