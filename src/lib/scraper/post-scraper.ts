import { BrowserContext, Page } from 'playwright';
import { createStealthBrowser, loadCookies } from './playwright-client';
import { sleep, randomDelay } from './human-behavior';

interface Post {
    id: string;
    mediaUrls: string[];
    mediaType: 'image' | 'video' | 'carousel';
    caption?: string;
    postedAt: Date;
    carouselIndex?: number;
}

interface ScrapePostsResult {
    success: boolean;
    posts: Post[];
    error?: string;
}

/**
 * Scrape Instagram posts from a specific user
 * Uses existing session cookies to avoid re-login
 */
export async function scrapeUserPosts(
    username: string,
    sessionCookies: string,
    maxPosts: number = 12
): Promise<ScrapePostsResult> {
    let browser = null;

    try {
        const { browser: br, context } = await createStealthBrowser();
        browser = br;

        // Load session cookies
        await loadCookies(context, sessionCookies);

        const page = await context.newPage();

        // Navigate to user's profile
        await page.goto(`https://www.instagram.com/${username}/`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        await sleep(3000, 5000);

        // Scroll to load posts
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });
        await sleep(2000, 3000);

        // Find post thumbnails
        const postLinkSelectors = [
            'a[href*="/p/"]',
            'a[role="link"][href*="/p/"]',
        ];

        let postLinks: string[] = [];
        for (const selector of postLinkSelectors) {
            try {
                const links = await page.locator(selector).all();
                postLinks = await Promise.all(
                    links.slice(0, maxPosts).map(link => link.getAttribute('href'))
                );
                postLinks = postLinks.filter(link => link !== null) as string[];
                if (postLinks.length > 0) break;
            } catch (e) {
                continue;
            }
        }

        if (postLinks.length === 0) {
            await browser.close();
            return {
                success: true,
                posts: [], // No posts found
            };
        }

        const posts: Post[] = [];

        // Visit each post to get full details
        for (const postLink of postLinks.slice(0, maxPosts)) {
            try {
                const fullUrl = postLink.startsWith('http')
                    ? postLink
                    : `https://www.instagram.com${postLink}`;

                await page.goto(fullUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000,
                });

                await sleep(2000, 4000);

                // Extract post ID from URL
                const postId = postLink.match(/\/p\/([^\/]+)/)?.[1] || '';

                // Get caption
                let caption = '';
                const captionSelectors = [
                    'h1',
                    'span[dir="auto"]',
                    'div[data-testid="post-comment-root"]',
                ];

                for (const selector of captionSelectors) {
                    try {
                        const captionElement = page.locator(selector).first();
                        const text = await captionElement.textContent({ timeout: 1000 });
                        if (text && text.length > 0) {
                            caption = text;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                // Get media URLs
                const mediaUrls: string[] = [];
                let mediaType: 'image' | 'video' | 'carousel' = 'image';

                // Check for carousel (multiple images/videos)
                const carouselButtonSelectors = [
                    'button[aria-label="Next"]',
                    'button[aria-label="Go to next photo"]',
                ];

                let isCarousel = false;
                for (const selector of carouselButtonSelectors) {
                    try {
                        const button = page.locator(selector).first();
                        if (await button.isVisible({ timeout: 1000 })) {
                            isCarousel = true;
                            mediaType = 'carousel';
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                if (isCarousel) {
                    // Scrape carousel items
                    let hasMore = true;
                    let carouselCount = 0;
                    const maxCarouselItems = 10;

                    while (hasMore && carouselCount < maxCarouselItems) {
                        // Get current media
                        const videoSelectors = ['video'];
                        const imageSelectors = ['img[style*="object-fit"]', 'img[srcset]'];

                        let mediaUrl = '';

                        // Try video first
                        for (const selector of videoSelectors) {
                            try {
                                const video = page.locator(selector).first();
                                if (await video.isVisible({ timeout: 1000 })) {
                                    mediaUrl = await video.getAttribute('src') || '';
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        // If no video, try image
                        if (!mediaUrl) {
                            for (const selector of imageSelectors) {
                                try {
                                    const image = page.locator(selector).first();
                                    if (await image.isVisible({ timeout: 1000 })) {
                                        mediaUrl = await image.getAttribute('src') || '';
                                        break;
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }

                        if (mediaUrl && !mediaUrls.includes(mediaUrl)) {
                            mediaUrls.push(mediaUrl);
                        }

                        // Try to go to next item
                        let nextClicked = false;
                        for (const selector of carouselButtonSelectors) {
                            try {
                                const nextButton = page.locator(selector).first();
                                if (await nextButton.isVisible({ timeout: 1000 })) {
                                    await nextButton.click();
                                    await sleep(1000, 2000);
                                    nextClicked = true;
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        if (!nextClicked) {
                            hasMore = false;
                        }

                        carouselCount++;
                    }
                } else {
                    // Single image or video
                    const videoSelectors = ['video'];
                    const imageSelectors = ['img[style*="object-fit"]', 'img[srcset]'];

                    // Try video
                    for (const selector of videoSelectors) {
                        try {
                            const video = page.locator(selector).first();
                            if (await video.isVisible({ timeout: 1000 })) {
                                const url = await video.getAttribute('src') || '';
                                if (url) {
                                    mediaUrls.push(url);
                                    mediaType = 'video';
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    // If no video, try image
                    if (mediaUrls.length === 0) {
                        for (const selector of imageSelectors) {
                            try {
                                const image = page.locator(selector).first();
                                if (await image.isVisible({ timeout: 1000 })) {
                                    const url = await image.getAttribute('src') || '';
                                    if (url) {
                                        mediaUrls.push(url);
                                        mediaType = 'image';
                                        break;
                                    }
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                }

                if (mediaUrls.length > 0) {
                    posts.push({
                        id: postId,
                        mediaUrls,
                        mediaType,
                        caption,
                        postedAt: new Date(), // TODO: Extract actual post date
                    });
                }

                // Random delay before next post
                await sleep(2000, 4000);
            } catch (error) {
                console.error('Error scraping post:', error);
                continue;
            }
        }

        await browser.close();

        return {
            success: true,
            posts,
        };
    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('Post scraping error:', error);
        return {
            success: false,
            posts: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
