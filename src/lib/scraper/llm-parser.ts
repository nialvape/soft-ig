/**
 * LLM-powered HTML parser for Instagram scraping
 * Uses free models from OpenRouter with fallback rotation
 */

interface LLMProvider {
    model: string;
    name: string;
}

// Free LLM models from OpenRouter (rotating to avoid rate limits)
const FREE_MODELS: LLMProvider[] = [
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B' },
    { model: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B' },
    { model: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B' },
    { model: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini' },
    { model: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B' },
];

let currentModelIndex = 0;

/**
 * Call OpenRouter API with automatic model rotation
 */
async function callLLM(prompt: string, systemPrompt: string): Promise<string> {
    const maxRetries = FREE_MODELS.length;

    for (let i = 0; i < maxRetries; i++) {
        const provider = FREE_MODELS[currentModelIndex];
        currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
                    'X-Title': 'Soft-IG',
                },
                body: JSON.stringify({
                    model: provider.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.1, // Low temperature for consistent results
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                console.warn(`Model ${provider.name} failed, trying next...`);
                continue;
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.warn(`Error with ${provider.name}:`, error);
            continue;
        }
    }

    throw new Error('All LLM providers failed');
}

/**
 * Find story ring selector using LLM
 */
export async function findStoryRingSelector(html: string): Promise<string[]> {
    const systemPrompt = `You are an expert HTML analyzer for Instagram web scraping.
Your task is to find CSS selectors for Instagram story rings (the circular profile pictures with colored borders that indicate available stories).

CRITICAL RULES:
1. Return ONLY a JSON array of CSS selectors, nothing else
2. Selectors should target clickable elements that open stories
3. Look for profile pictures, canvas elements, or story indicators
4. Prioritize selectors that are specific and unlikely to change
5. Return at least 3 different selector options

Example output format:
["img[alt*='profile picture']", "canvas", "header img"]`;

    const prompt = `Analyze this Instagram profile page HTML and find CSS selectors for the story ring (the element to click to view stories).
The story ring is usually a profile picture with a gradient border or a canvas element nearby.

HTML snippet (first 3000 chars):
${html.substring(0, 3000)}

Return a JSON array of CSS selectors that would reliably find and click the story ring.`;

    try {
        const response = await callLLM(prompt, systemPrompt);

        // Extract JSON from response
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Fallback to default selectors
        return [
            'img[alt*="profile picture"]',
            'canvas',
            'header img',
        ];
    } catch (error) {
        console.error('LLM selector finding failed:', error);
        // Return default selectors as fallback
        return [
            'img[alt*="profile picture"]',
            'canvas',
            'header img',
        ];
    }
}

/**
 * Find story media selectors using LLM
 */
export async function findStoryMediaSelectors(html: string): Promise<{ video: string[], image: string[] }> {
    const systemPrompt = `You are an expert HTML analyzer for Instagram story scraping.
Your task is to find CSS selectors for story media (videos and images) in the Instagram story viewer.

CRITICAL CONTEXT:
- Instagram story viewer shows ONE story at a time in a modal/overlay
- Story media is typically in a <video> or <img> tag that is LARGE (1080x1920 or similar)
- Profile pictures are SMALL circular images - IGNORE these
- Story images often have attributes like: role="img", draggable="false", object-fit styles
- Story videos are in <video> tags with playsinline, autoplay attributes

CRITICAL RULES:
1. Return ONLY a JSON object with "video" and "image" arrays of selectors
2. Video selectors should target <video> elements that are NOT thumbnails
3. Image selectors should target LARGE <img> elements (story content, NOT profile pictures)
4. Look for images with srcset, sizes, or object-fit styles
5. AVOID selectors that would match small profile pictures or thumbnails
6. Return at least 3-5 specific selectors for each type

Example output format:
{"video": ["video[playsinline]", "video[autoplay]"], "image": ["img[srcset][sizes]", "img[style*='object-fit: cover']"]}`;

    const prompt = `Analyze this Instagram story viewer HTML and find CSS selectors for LARGE story media (videos and images).

IMPORTANT: We need selectors that match the MAIN story content (large images/videos), NOT profile pictures or thumbnails.

HTML snippet (first 8000 chars):
${html.substring(0, 8000)}

Return a JSON object with "video" and "image" arrays containing CSS selectors that target ONLY the main story media.`;

    try {
        const response = await callLLM(prompt, systemPrompt);

        // Extract JSON from response
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Fallback - more specific selectors to avoid profile pictures
        return {
            video: ['video[playsinline]', 'video[autoplay]', 'video[src]'],
            image: [
                'img[srcset][sizes]',
                'img[style*="object-fit: cover"]',
                'img[role="img"]',
                'img[draggable="false"]:not([alt*="profile"])'
            ],
        };
    } catch (error) {
        console.error('LLM media selector finding failed:', error);
        return {
            video: ['video[playsinline]', 'video[autoplay]', 'video[src]'],
            image: [
                'img[srcset][sizes]',
                'img[style*="object-fit: cover"]',
                'img[role="img"]',
                'img[draggable="false"]:not([alt*="profile"])'
            ],
        };
    }
}

/**
 * Find next button selector using LLM
 */
export async function findNextButtonSelector(html: string): Promise<string[]> {
    const systemPrompt = `You are an expert HTML analyzer for Instagram story navigation.
Your task is to find CSS selectors for the "next story" button.

CRITICAL RULES:
1. Return ONLY a JSON array of CSS selectors
2. Look for buttons with "Next" aria-label or similar
3. Include both button elements and clickable divs
4. Return at least 3 different options

Example output format:
["button[aria-label='Next']", "button[aria-label*='next']", "div[role='button']"]`;

    const prompt = `Find CSS selectors for the button that navigates to the next story in Instagram's story viewer.

HTML snippet:
${html.substring(0, 3000)}

Return a JSON array of CSS selectors.`;

    try {
        const response = await callLLM(prompt, systemPrompt);
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return ['button[aria-label="Next"]', 'button[aria-label*="next"]'];
    } catch (error) {
        console.error('LLM next button finding failed:', error);
        return ['button[aria-label="Next"]', 'button[aria-label*="next"]'];
    }
}
