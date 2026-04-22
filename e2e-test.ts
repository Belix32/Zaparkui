import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    passed: [],
    failed: [],
    consoleErrors: []
  };

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    results.consoleErrors.push(`[PAGE ERROR] ${error.message}`);
  });

  console.log('═'.repeat(60));
  console.log('🧪 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ ПРОЕКТА "ЗАПАРКУЙ"');
  console.log('═'.repeat(60));

  // Test 1: Main page loads
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    const title = await page.title();
    if (title.includes('Запаркуй')) {
      results.passed.push('Главная страница загружается');
    } else {
      results.failed.push('Главная страница: неверный title');
    }
  } catch (e) {
    results.failed.push(`Главная страница: ${e.message}`);
  }

  // Test 2: All routes work
  const routes = ['/', '/catalog', '/login', '/register', '/dashboard'];
  for (const route of routes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      const bodyText = await page.textContent('body');
      if (bodyText && bodyText.length > 0) {
        results.passed.push(`Маршрут ${route} работает`);
      } else {
        results.failed.push(`Маршрут ${route}: пустая страница`);
      }
    } catch (e) {
      results.failed.push(`Маршрут ${route}: ${e.message}`);
    }
  }

  // Test 3: Registration functionality
  try {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });

    // Check if form exists
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const buttonExists = await submitButton.count() > 0;

    if (emailExists && passwordExists && buttonExists) {
      results.passed.push('Форма регистрации: все поля присутствуют');

      // Try to fill and submit
      await emailInput.fill('testuser@example.com');
      await passwordInput.fill('TestPassword123!');
      await submitButton.click();
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/login')) {
        results.passed.push('Регистрация: перенаправление работает');
      } else {
        results.failed.push('Регистрация: нет перенаправления после отправки');
      }
    } else {
      results.failed.push('Форма регистрации: отсутствуют поля ввода');
    }
  } catch (e) {
    results.failed.push(`Регистрация: ${e.message}`);
  }

  // Test 4: Login functionality
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const buttonExists = await submitButton.count() > 0;

    if (emailExists && passwordExists && buttonExists) {
      results.passed.push('Форма входа: все поля присутствуют');

      await emailInput.fill('testuser@example.com');
      await passwordInput.fill('TestPassword123!');
      await submitButton.click();
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        results.passed.push('Вход в систему: перенаправление работает');
      } else {
        results.failed.push('Вход в систему: нет перенаправления на dashboard');
      }
    } else {
      results.failed.push('Форма входа: отсутствуют поля ввода');
    }
  } catch (e) {
    results.failed.push(`Вход в систему: ${e.message}`);
  }

  // Test 5: Dashboard - Add parking functionality
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Check for dashboard elements
    const bodyText = await page.textContent('body');
    const hasDashboardContent = bodyText.includes('Личный') || bodyText.includes('парковк') || bodyText.includes('Dashboard');

    if (hasDashboardContent) {
      results.passed.push('Dashboard: контент отображается');

      // Check for add parking form
      const addButton = page.locator('button:has-text("Добавить"), button:has-text("Добавить парковку")').first();
      if (await addButton.count() > 0) {
        results.passed.push('Dashboard: кнопка добавления парковки найдена');
      } else {
        results.failed.push('Dashboard: кнопка добавления парковки не найдена');
      }
    } else {
      results.failed.push('Dashboard: контент не отображается');
    }
  } catch (e) {
    results.failed.push(`Dashboard: ${e.message}`);
  }

  // Test 6: Catalog filters
  try {
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded' });

    const bodyText = await page.textContent('body');
    const hasCatalogContent = bodyText.includes('Каталог') || bodyText.includes('парковк') || bodyText.includes('Parking');

    if (hasCatalogContent) {
      results.passed.push('Каталог: контент отображается');

      // Check for filter elements
      const filterSelectors = ['input', 'select', 'button'];
      let filterCount = 0;

      for (const selector of filterSelectors) {
        filterCount += await page.locator(selector).count();
      }

      if (filterCount > 3) {
        results.passed.push('Каталог: фильтры/элементы присутствуют');
      } else {
        results.failed.push('Каталог: фильтры не найдены');
      }
    } else {
      results.failed.push('Каталог: контент не отображается');
    }
  } catch (e) {
    results.failed.push(`Каталог: ${e.message}`);
  }

  // Test 7: Navigation works
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Click on catalog link
    const catalogLink = page.locator('a[href="/catalog"], a:has-text("Каталог")').first();
    if (await catalogLink.count() > 0) {
      await catalogLink.click();
      await page.waitForURL('**/catalog', { timeout: 3000 });
      results.passed.push('Навигация: переход в каталог работает');
    } else {
      results.failed.push('Навигация: ссылка на каталог не найдена');
    }

    // Click on login link
    const loginLink = page.locator('a[href="/login"], a:has-text("Вход")').first();
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 3000 });
      results.passed.push('Навигация: переход на вход работает');
    } else {
      results.failed.push('Навигация: ссылка на вход не найдена');
    }
  } catch (e) {
    results.failed.push(`Навигация: ${e.message}`);
  }

  await browser.close();

  // Print results
  console.log('\n' + '═'.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
  console.log('═'.repeat(60));

  console.log(`\n✅ УСПЕШНО: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`  ✓ ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ НЕУДАЧНО: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`  ✗ ${test}`));
  }

  if (results.consoleErrors.length > 0) {
    console.log(`\n⚠️ ОШИБКИ КОНСОЛИ: ${results.consoleErrors.length}`);
    results.consoleErrors.forEach(err => console.log(`  [!] ${err}`));
  } else {
    console.log('\n✅ Ошибок консоли не обнаружено');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('ИТОГО');
  console.log('═'.repeat(60));
  console.log(`Пройдено тестов: ${results.passed.length}`);
  console.log(`Провалено тестов: ${results.failed.length}`);
  console.log(`Ошибок консоли: ${results.consoleErrors.length}`);
  console.log('═'.repeat(60));

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);