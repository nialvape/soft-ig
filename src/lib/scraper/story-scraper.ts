import { BrowserContext, Page } from 'playwright';
import { createStealthBrowser, loadCookies } from './playwright-client';
import { sleep, randomDelay } from './human-behavior';
import { findStoryMediaSelectors, findNextButtonSelector } from './llm-parser';

interface Story {
    id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    thumbnailUrl?: string;
    postedAt: Date;
}

interface ScrapeStoriesResult {
    success: boolean;
    stories: Story[];
    error?: string;
}

/**
 * Scrape Instagram stories from a specific user
 * Uses direct story URL access + LLM for media detection
 */
export async function scrapeUserStories(
    username: string,
    sessionCookies: string
): Promise<ScrapeStoriesResult> {
    let browser = null;

    try {
        const { browser: br, context } = await createStealthBrowser();
        browser = br;

        // Load session cookies
        await loadCookies(context, sessionCookies);

        const page = await context.newPage();

        // Navigate to user's profile page first (more natural)
        console.log(`🔍 Navigating to @${username}'s profile...`);

        await page.goto(`https://www.instagram.com/${username}/`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        await sleep(3000, 5000);

        // Check if session expired (redirected to login)
        const currentUrl = page.url();
        if (currentUrl.includes('/accounts/login')) {
            await browser.close();
            console.log('❌ Session expired - need to reconnect Instagram account');
            return {
                success: false,
                stories: [],
                error: 'Instagram session expired. Please reconnect your account in Settings.',
            };
        }

        // Look for story ring (indicates user has active stories)
        console.log('🔍 Looking for story ring...');

        // Try multiple selectors for the story ring
        // Priority: profile picture in header (most reliable)
        const storyRingSelectors = [
            'header img[alt*="profile"]',
            'header img',
            `a[href="/stories/${username}/"]`,
            'canvas[style*="linear-gradient"]',
        ];

        let storyRingFound = false;
        for (const selector of storyRingSelectors) {
            try {
                const elements = await page.locator(selector).all();
                if (elements.length > 0) {
                    console.log(`✅ Found ${elements.length} element(s) with selector: ${selector}`);
                    // Click the first visible element
                    for (const element of elements) {
                        try {
                            const isVisible = await element.isVisible({ timeout: 1000 });
                            if (isVisible) {
                                await sleep(1000, 2000);
                                await element.click();
                                storyRingFound = true;
                                console.log(`👆 Clicked story ring (selector: ${selector})`);
                                break;
                            }
                        } catch (e) {
                            console.log(`⚠️ Could not click element: ${e.message}`);
                            continue;
                        }
                    }
                    if (storyRingFound) break;
                }
            } catch (e) {
                console.log(`⚠️ Error with selector ${selector}: ${e.message}`);
                continue;
            }
        }

        if (!storyRingFound) {
            // No story ring found - user might not have stories
            console.log('⚠️ No story ring found, trying direct URL...');
            await page.goto(`https://www.instagram.com/stories/${username}/`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
        }

        await sleep(3000, 5000);

        // Check final URL
        const finalUrl = page.url();
        console.log(`📍 Current URL: ${finalUrl}`);

        // If redirected back to profile, user has no stories
        if (finalUrl.includes(`/${username}/`) && !finalUrl.includes('/stories/')) {
            await browser.close();
            console.log('❌ No active stories for this user');
            return {
                success: true,
                stories: [],
            };
        }

        // We should be in story viewer now - wait for story elements to load
        console.log('⏳ Waiting for story viewer to load...');
        await sleep(3000, 4000);

        // Try to wait for common story elements
        try {
            await page.waitForSelector('video, img[src*="scontent"]', { timeout: 5000 });
            console.log('✅ Story media elements detected');
        } catch (e) {
            console.log('⚠️ No story media elements found with waitForSelector');
        }

        await sleep(2000, 3000);

        // Get HTML - try to extract from story container if possible
        let storyHtml = await page.content();

        // Try to get just the story container HTML for better LLM analysis
        try {
            const storyContainer = await page.locator('section, [role="dialog"], main').first().innerHTML();
            if (storyContainer && storyContainer.length > 1000) {
                storyHtml = storyContainer;
                console.log('📦 Using story container HTML');
            }
        } catch (e) {
            console.log('📄 Using full page HTML');
        }

        // Log HTML snippet for debugging
        console.log('📄 HTML snippet (first 500 chars):', storyHtml.substring(0, 500));

        // Count total images and videos on page
        const totalVideos = await page.locator('video').count();
        const totalImages = await page.locator('img').count();
        console.log(`📊 Page has ${totalVideos} video(s) and ${totalImages} image(s) total`);

        // Use LLM to find media selectors
        console.log('🤖 Using LLM to find story media selectors...');
        const mediaSelectors = await findStoryMediaSelectors(storyHtml);
        console.log('📍 LLM found media selectors:', mediaSelectors);

        // Use LLM to find next button selectors
        console.log('🤖 Using LLM to find next button selectors...');
        const nextSelectors = await findNextButtonSelector(storyHtml);
        console.log('📍 LLM found next selectors:', nextSelectors);

        // Add fallback selectors if LLM didn't provide enough
        if (mediaSelectors.video.length === 0) {
            mediaSelectors.video = ['video'];
        }
        if (mediaSelectors.image.length === 0) {
            mediaSelectors.image = ['img'];
        }

        // Always add generic fallbacks at the end
        mediaSelectors.video.push('video');
        mediaSelectors.image.push('img[src*="scontent"]', 'img');

        const stories: Story[] = [];
        const seenUrls = new Set<string>();
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 2; // Reduced to 2 for faster detection
        const maxStories = 50;

        while (stories.length < maxStories && consecutiveFailures < maxConsecutiveFailures) {
            try {
                // Wait for content to load after navigation
                await sleep(3000, 4000);

                let mediaUrl = '';
                let mediaType: 'image' | 'video' = 'image';
                const foundMedia: Array<{ url: string, type: string, reason?: string }> = [];

                // Try video selectors first
                for (const selector of mediaSelectors.video) {
                    try {
                        const videos = await page.locator(selector).all();
                        if (videos.length > 0) {
                            console.log(`🔍 Found ${videos.length} video(s) with selector: ${selector}`);
                        }
                        for (const video of videos) {
                            try {
                                const isVisible = await video.isVisible({ timeout: 500 });
                                if (!isVisible) continue;

                                // Try to get video source (can be blob URL, http, or in source element)
                                let src = await video.getAttribute('src');

                                // If no src, try to find source child element
                                if (!src || src === '') {
                                    try {
                                        const sourceEl = video.locator('source').first();
                                        if (await sourceEl.count() > 0) {
                                            src = await sourceEl.getAttribute('src');
                                        }
                                    } catch (e) {
                                        // No source element
                                    }
                                }

                                if (src && (src.startsWith('http') || src.startsWith('blob'))) {
                                    const displaySrc = src.startsWith('blob') ? 'blob:...' : src.substring(0, 60);
                                    foundMedia.push({ url: displaySrc, type: 'video', reason: '✅ ACCEPTED' });
                                    mediaUrl = src;
                                    mediaType = 'video';
                                    console.log(`✅ Found video: ${displaySrc}`);
                                    break;
                                } else {
                                    foundMedia.push({ url: src || 'no-src', type: 'video', reason: 'No valid video URL' });
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                        if (mediaUrl) break;
                    } catch (e) {
                        continue;
                    }
                }

                // If no video, try image selectors
                if (!mediaUrl) {
                    for (const selector of mediaSelectors.image) {
                        try {
                            const images = await page.locator(selector).all();
                            if (images.length > 0) {
                                console.log(`🔍 Found ${images.length} image(s) with selector: ${selector}`);
                            }
                            for (const image of images) {
                                try {
                                    const isVisible = await image.isVisible({ timeout: 500 });
                                    if (!isVisible) continue;

                                    const src = await image.getAttribute('src');
                                    if (!src || !src.startsWith('http')) {
                                        foundMedia.push({ url: src || 'no-src', type: 'image', reason: 'No valid URL' });
                                        continue;
                                    }

                                    // Filter out profile pictures by URL patterns
                                    if (src.includes('82787-19')) {
                                        foundMedia.push({ url: src.substring(0, 60), type: 'image', reason: 'Profile picture CDN pattern (82787-19)' });
                                        continue;
                                    }
                                    if (src.includes('/profile')) {
                                        foundMedia.push({ url: src.substring(0, 60), type: 'image', reason: 'Contains /profile in URL' });
                                        continue;
                                    }

                                    // Get image dimensions - use NATURAL dimensions (actual image size)
                                    // not the rendered bounding box size
                                    const dimensions = await image.evaluate((img: HTMLImageElement) => ({
                                        naturalWidth: img.naturalWidth,
                                        naturalHeight: img.naturalHeight,
                                        displayWidth: img.width,
                                        displayHeight: img.height,
                                    }));

                                    // Story images are at least 300px wide OR 600px tall (vertical stories)
                                    // Using natural dimensions to avoid filtering correctly-sized images that are rendered smaller
                                    if (dimensions.naturalWidth < 300 && dimensions.naturalHeight < 600) {
                                        foundMedia.push({
                                            url: src.substring(0, 60),
                                            type: 'image',
                                            reason: `Too small: ${dimensions.naturalWidth}x${dimensions.naturalHeight}px (natural)`
                                        });
                                        continue;
                                    }

                                    // This looks like a valid story image!
                                    foundMedia.push({ url: src.substring(0, 60), type: 'image', reason: '✅ ACCEPTED' });
                                    mediaUrl = src;
                                    mediaType = 'image';
                                    break;
                                } catch (e) {
                                    continue;
                                }
                            }
                            if (mediaUrl) break;
                        } catch (e) {
                            continue;
                        }
                    }
                }

                // Log all found media for debugging
                if (foundMedia.length > 0) {
                    console.log('📊 Media detection results:');
                    foundMedia.forEach((m, i) => {
                        console.log(`  ${i + 1}. [${m.type}] ${m.url}... ${m.reason ? `- ${m.reason}` : ''}`);
                    });
                }

                if (mediaUrl && !seenUrls.has(mediaUrl)) {
                    seenUrls.add(mediaUrl);
                    consecutiveFailures = 0; // Reset on success

                    const storyId = `${username}_story_${Date.now()}_${stories.length}`;
                    stories.push({
                        id: storyId,
                        mediaUrl,
                        mediaType,
                        postedAt: new Date(),
                    });

                    console.log(`✅ Found story ${stories.length}: ${mediaType} - ${mediaUrl.substring(0, 50)}...`);
                } else if (mediaUrl && seenUrls.has(mediaUrl)) {
                    // Same story, we've looped back
                    console.log('🔄 Reached end of stories (looped back)');
                    break;
                } else {
                    consecutiveFailures++;
                    console.log(`⚠️ No media found (failure ${consecutiveFailures}/${maxConsecutiveFailures})`);
                }

                // Store current URL before navigation
                const urlBeforeNav = page.url();

                // Try to navigate to next story
                let navigated = false;

                // Method 1: Press arrow key (most reliable)
                try {
                    await page.keyboard.press('ArrowRight');
                    await sleep(3000, 4000); // Wait longer for new story to load

                    // Check if URL changed or new media loaded
                    const urlAfterNav = page.url();
                    if (urlAfterNav !== urlBeforeNav) {
                        navigated = true;
                        console.log('➡️ Navigated via arrow key (URL changed)');
                    }
                } catch (e) {
                    // Failed
                }

                // Method 2: Click next button if arrow didn't work
                if (!navigated) {
                    for (const selector of nextSelectors) {
                        try {
                            const nextButton = page.locator(selector).first();
                            if (await nextButton.isVisible({ timeout: 1000 })) {
                                await nextButton.click();
                                await sleep(2000, 3000);
                                navigated = true;
                                console.log('➡️ Clicked next button');
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }

                // Method 3: Click right side of screen
                if (!navigated) {
                    try {
                        const viewport = page.viewportSize();
                        if (viewport) {
                            await page.mouse.click(viewport.width * 0.85, viewport.height / 2);
                            await sleep(2000, 3000);
                            navigated = true;
                            console.log('➡️ Clicked right side');
                        }
                    } catch (e) {
                        // Failed
                    }
                }

                if (!navigated) {
                    console.log('❌ Could not navigate to next story, ending');
                    break;
                }

            } catch (error) {
                console.error('Error in story loop:', error);
                consecutiveFailures++;
            }
        }

        await browser.close();

        console.log(`✅ Scraping complete: ${stories.length} stories found`);

        return {
            success: true,
            stories,
        };
    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('Story scraping error:', error);
        return {
            success: false,
            stories: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Download media from URL and return as Buffer
 */
export async function downloadMedia(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
