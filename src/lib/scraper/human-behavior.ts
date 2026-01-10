/**
 * Human-like behavior utilities for Playwright scraper
 * CRITICAL: These utilities help avoid Instagram detection and bans
 */

/**
 * Generate random delay within a range
 */
export function randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for a random duration
 */
export async function sleep(min: number, max: number): Promise<void> {
    const delay = randomDelay(min, max);
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate "thinking" pause (longer random delay)
 */
export async function thinkingPause(): Promise<void> {
    await sleep(5000, 15000); // 5-15 seconds
}

/**
 * Get random delay values from environment or use defaults
 */
export function getScraperDelays() {
    return {
        min: parseInt(process.env.SCRAPER_DELAY_MIN || '2000'),
        max: parseInt(process.env.SCRAPER_DELAY_MAX || '5000'),
    };
}
