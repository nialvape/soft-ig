"use client";

import { useState } from "react";

interface ScrapedStory {
    id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    username: string;
}

export default function ScraperTestPanel() {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [previewStories, setPreviewStories] = useState<ScrapedStory[]>([]);

    const handleScrapeStories = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setPreviewStories([]);

        try {
            const response = await fetch("/api/scraper/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to scrape stories");
                return;
            }

            setResult(data);

            // Fetch preview of scraped stories
            if (data.storiesSaved > 0) {
                const previewResponse = await fetch(`/api/scraper/preview?username=${username}&type=story`);
                if (previewResponse.ok) {
                    const previewData = await previewResponse.json();
                    setPreviewStories(previewData.stories || []);
                }
            }
        } catch (error) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleScrapePosts = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setPreviewStories([]);

        try {
            const response = await fetch("/api/scraper/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, maxPosts: 6 }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to scrape posts");
                return;
            }

            setResult(data);
        } catch (error) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">🧪 Test Scraper</h3>

            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Instagram Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />

                <div className="flex gap-3">
                    <button
                        onClick={handleScrapeStories}
                        disabled={loading || !username}
                        className="flex-1 rounded-full bg-blue-500 text-white px-6 py-3 font-medium hover:bg-blue-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {loading ? "Scraping..." : "Scrape Stories"}
                    </button>
                    <button
                        onClick={handleScrapePosts}
                        disabled={loading || !username}
                        className="flex-1 rounded-full bg-purple-500 text-white px-6 py-3 font-medium hover:bg-purple-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {loading ? "Scraping..." : "Scrape Posts"}
                    </button>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                        <p className="text-sm text-green-400 font-medium mb-2">Success!</p>
                        <pre className="text-xs text-green-300 overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Preview scraped stories */}
                {previewStories.length > 0 && (
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                        <p className="text-sm text-blue-400 font-medium mb-3">📸 Scraped Stories Preview</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {previewStories.map((story, index) => (
                                <div key={story.id} className="relative rounded-lg overflow-hidden bg-white/5">
                                    {story.mediaType === 'image' ? (
                                        <img
                                            src={story.mediaUrl}
                                            alt={`Story ${index + 1}`}
                                            className="w-full h-32 object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={story.mediaUrl}
                                            className="w-full h-32 object-cover"
                                            controls
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                        <p className="text-xs text-white">
                                            {story.mediaType === 'video' ? '🎥' : '📷'} Story {index + 1}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-400">
                    Note: Make sure you've connected your Instagram account in Settings first
                </p>
            </div>
        </div>
    );
}
