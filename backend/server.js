const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Soft-IG Backend',
        timestamp: new Date().toISOString(),
    });
});

// Instagram connection endpoint
app.post('/api/instagram/connect', async (req, res) => {
    try {
        const { username, password, twoFactorCode } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Import dynamically to avoid issues
        const { loginToInstagram } = await import('../src/lib/scraper/instagram-login.js');

        const result = await loginToInstagram(username, password, twoFactorCode);

        if (!result.success) {
            if (result.requires2FA) {
                return res.status(400).json({ error: '2FA required', requires2FA: true });
            }
            return res.status(400).json({ error: result.error || 'Login failed' });
        }

        res.json({
            success: true,
            sessionCookies: result.sessionCookies,
        });
    } catch (error) {
        console.error('Instagram connect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Story scraping endpoint (placeholder for now)
app.post('/api/scraper/stories', async (req, res) => {
    try {
        // TODO: Implement story scraping logic
        res.json({
            success: true,
            message: 'Story scraping not yet implemented',
        });
    } catch (error) {
        console.error('Story scraping error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Post scraping endpoint (placeholder for now)
app.post('/api/scraper/posts', async (req, res) => {
    try {
        // TODO: Implement post scraping logic
        res.json({
            success: true,
            message: 'Post scraping not yet implemented',
        });
    } catch (error) {
        console.error('Post scraping error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Soft-IG Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
