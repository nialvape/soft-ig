# LLM-Powered Instagram Scraper Setup

## Quick Setup

The scraper now uses free LLMs to intelligently parse Instagram's HTML and find selectors dynamically. This makes it resilient to Instagram's frequent HTML changes.

### 1. Get OpenRouter API Key (Free)

1. Go to https://openrouter.ai/keys
2. Sign up with GitHub or Google (free)
3. Click "Create Key"
4. Copy your API key (starts with `sk-or-v1-...`)

### 2. Add to Environment

Add this line to your `.env.local` file:

```bash
OPENROUTER_API_KEY="sk-or-v1-your-actual-key-here"
```

### 3. How It Works

The scraper uses **5 free LLM models** from OpenRouter, rotating between them to avoid rate limits:

1. **Meta Llama 3.2 3B** - Fast and accurate
2. **Google Gemma 2 9B** - Good at HTML analysis
3. **Mistral 7B** - Reliable fallback
4. **Microsoft Phi-3 Mini** - Efficient
5. **Qwen 2 7B** - Strong reasoning

When scraping:
1. Playwright loads the Instagram page
2. LLM analyzes the HTML
3. LLM returns CSS selectors for:
   - Story ring (to click)
   - Story media (videos/images)
   - Next button (navigation)
4. Scraper uses these selectors
5. If one model fails, automatically tries the next

### 4. Benefits

✅ **Adaptive** - Works even when Instagram changes HTML  
✅ **Free** - All models are free on OpenRouter  
✅ **Reliable** - 5 fallback models  
✅ **Smart** - LLMs understand context better than regex  

### 5. Test It

```bash
npm run dev
```

1. Go to http://localhost:3000/settings
2. Connect Instagram account
3. Go to http://localhost:3000/feed
4. Enter username and click "Scrape Stories"

The LLM will analyze the page and find stories automatically!

### 6. Rate Limits

- Each free model has ~20 requests/minute
- Scraper rotates between 5 models = ~100 requests/minute
- More than enough for normal usage

### 7. Troubleshooting

**"All LLM providers failed"**
- Check your API key is correct
- Check internet connection
- Try again (models sometimes have downtime)

**Still not finding stories**
- The LLM will log which selectors it found
- Check browser console for debug info
- Instagram may have changed their structure significantly
