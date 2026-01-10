import { chromium, BrowserContext, Browser } from 'playwright';

/**
 * Create a stealth browser context that avoids detection
 */
export async function createStealthBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
        ],
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: [],
        geolocation: undefined,
        colorScheme: 'light',
    });

    // Remove webdriver flag
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });

        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });

    return { browser, context };
}

/**
 * Load cookies into browser context
 */
export async function loadCookies(
    context: BrowserContext,
    cookiesJson: string
): Promise<void> {
    const cookies = JSON.parse(cookiesJson);
    await context.addCookies(cookies);
}

/**
 * Save cookies from browser context
 */
export async function saveCookies(context: BrowserContext): Promise<string> {
    const cookies = await context.cookies();
    return JSON.stringify(cookies);
}
