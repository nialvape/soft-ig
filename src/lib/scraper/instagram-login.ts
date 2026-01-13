import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { createStealthBrowser, saveCookies } from './playwright-client';
import { sleep, randomDelay } from './human-behavior';

interface InstagramLoginResult {
    success: boolean;
    sessionCookies?: string;
    requires2FA?: boolean;
    error?: string;
}

/**
 * Login to Instagram with human-like behavior
 * CRITICAL: This uses stealth mode and random delays to avoid detection
 */
export async function loginToInstagram(
    username: string,
    password: string,
    twoFactorCode?: string
): Promise<InstagramLoginResult> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
        // Create stealth browser
        const { browser: br, context: ctx } = await createStealthBrowser();
        browser = br;
        context = ctx;

        const page = await context.newPage();

        // Navigate to Instagram login page
        await page.goto('https://www.instagram.com/accounts/login/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        // Wait for page to load
        await sleep(3000, 5000);

        // Try multiple selectors for username input (Instagram changes these frequently)
        const usernameSelectors = [
            'input[name="username"]',
            'input[aria-label="Phone number, username, or email"]',
            'input[type="text"]',
            'input._aa4b._add6._ac4d._ap35', // Instagram's obfuscated class
        ];

        let usernameInput = null;
        for (const selector of usernameSelectors) {
            try {
                usernameInput = page.locator(selector).first();
                if (await usernameInput.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!usernameInput) {
            await browser.close();
            return {
                success: false,
                error: 'Could not find username input field. Instagram may have changed their page structure.',
            };
        }

        // Fill username with realistic typing
        await usernameInput.click();
        await sleep(500, 1000);

        // Type username character by character with random delays
        for (const char of username) {
            await usernameInput.type(char, { delay: randomDelay(50, 150) });
        }

        await sleep(800, 1500);

        // Try multiple selectors for password input
        const passwordSelectors = [
            'input[name="password"]',
            'input[aria-label="Password"]',
            'input[type="password"]',
        ];

        let passwordInput = null;
        for (const selector of passwordSelectors) {
            try {
                passwordInput = page.locator(selector).first();
                if (await passwordInput.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!passwordInput) {
            await browser.close();
            return {
                success: false,
                error: 'Could not find password input field.',
            };
        }

        // Fill password with realistic typing
        await passwordInput.click();
        await sleep(500, 1000);

        for (const char of password) {
            await passwordInput.type(char, { delay: randomDelay(50, 150) });
        }

        await sleep(1000, 2000);

        // Click login button - try multiple selectors
        const loginButtonSelectors = [
            'button[type="submit"]',
            'button:has-text("Log in")',
            'button:has-text("Log In")',
            'div[role="button"]:has-text("Log in")',
        ];

        let loginButton = null;
        for (const selector of loginButtonSelectors) {
            try {
                loginButton = page.locator(selector).first();
                if (await loginButton.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!loginButton) {
            await browser.close();
            return {
                success: false,
                error: 'Could not find login button.',
            };
        }

        await loginButton.click();

        // Wait for navigation or error
        await sleep(3000, 5000);

        // Check for 2FA prompt
        const twoFactorSelectors = [
            'input[name="verificationCode"]',
            'input[aria-label="Security Code"]',
            'input[placeholder*="code"]',
        ];

        let is2FAVisible = false;
        let twoFactorInput = null;

        for (const selector of twoFactorSelectors) {
            try {
                twoFactorInput = page.locator(selector).first();
                if (await twoFactorInput.isVisible({ timeout: 2000 })) {
                    is2FAVisible = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (is2FAVisible) {
            if (!twoFactorCode) {
                // 2FA required but no code provided
                await browser.close();
                return {
                    success: false,
                    requires2FA: true,
                };
            }

            // Enter 2FA code
            await sleep(1000, 2000);
            await twoFactorInput!.click();
            await sleep(500, 1000);

            for (const char of twoFactorCode) {
                await twoFactorInput!.type(char, { delay: randomDelay(50, 150) });
            }

            await sleep(1000, 2000);

            // Submit 2FA code
            const confirmSelectors = [
                'button:has-text("Confirm")',
                'button:has-text("Submit")',
                'button[type="submit"]',
            ];

            for (const selector of confirmSelectors) {
                try {
                    const confirmButton = page.locator(selector).first();
                    if (await confirmButton.isVisible({ timeout: 2000 })) {
                        await confirmButton.click();
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            await sleep(3000, 5000);
        }

        // Check if login was successful by looking for home page elements
        const homeIndicators = [
            'svg[aria-label="Home"]',
            'a[href="/"]',
            '[aria-label="Instagram"]',
            'nav',
        ];

        let isLoggedIn = false;
        for (const selector of homeIndicators) {
            try {
                if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
                    isLoggedIn = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!isLoggedIn) {
            // Check for error messages
            const errorSelectors = [
                'p[data-testid="login-error-message"]',
                'div[role="alert"]',
                'p:has-text("incorrect")',
                'p:has-text("Sorry")',
            ];

            let errorText = 'Login failed';
            for (const selector of errorSelectors) {
                try {
                    const errorElement = page.locator(selector).first();
                    const text = await errorElement.textContent({ timeout: 1000 });
                    if (text) {
                        errorText = text;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            await browser.close();
            return {
                success: false,
                error: errorText || 'Invalid credentials or Instagram blocked the login',
            };
        }

        // Login successful - save session cookies
        const sessionCookies = await saveCookies(context);

        await browser.close();

        return {
            success: true,
            sessionCookies,
        };
    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('Instagram login error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during login',
        };
    }
}

/**
 * Verify if Instagram session is still valid
 */
export async function verifyInstagramSession(sessionCookies: string): Promise<boolean> {
    let browser: Browser | null = null;

    try {
        const { browser: br, context } = await createStealthBrowser();
        browser = br;

        // Load saved cookies
        const cookies = JSON.parse(sessionCookies);
        await context.addCookies(cookies);

        const page = await context.newPage();
        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Check if still logged in
        const homeIndicators = [
            'svg[aria-label="Home"]',
            'nav',
            '[aria-label="Instagram"]',
        ];

        let isLoggedIn = false;
        for (const selector of homeIndicators) {
            try {
                if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
                    isLoggedIn = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        await browser.close();
        return isLoggedIn;
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        return false;
    }
}
