import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FeedPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Soft-IG</h1>
                    <div className="flex items-center gap-4">
                        <a
                            href="/settings"
                            className="text-sm px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
                        >
                            Settings
                        </a>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span className="text-sm text-gray-300">{session.user?.email}</span>
                        </div>
                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/" });
                            }}
                        >
                            <button
                                type="submit"
                                className="text-sm px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center space-y-8">
                    {/* Welcome Section */}
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-white">Welcome to Your Feed</h2>
                        <p className="text-gray-400 text-lg">
                            Your unified chronological feed will appear here
                        </p>
                    </div>

                    {/* Status Card */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm text-left">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-2xl">✓</span>
                            </div>
                            <h3 className="text-2xl font-semibold text-white">Phase 2: Authentication Complete</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white font-medium mb-3">✅ Implemented Features</h4>
                                <ul className="text-sm text-gray-400 space-y-2 ml-4">
                                    <li>• User registration and login working</li>
                                    <li>• Protected routes with middleware</li>
                                    <li>• Database sessions with NextAuth.js v5</li>
                                    <li>• Password hashing with bcrypt (cost 12)</li>
                                    <li>• Sleek dark theme UI</li>
                                </ul>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h4 className="text-white font-medium mb-3">🚀 Coming Next</h4>
                                <ul className="text-sm text-gray-400 space-y-2 ml-4">
                                    <li>• Instagram account connection flow</li>
                                    <li>• Playwright scraper with human-like behavior</li>
                                    <li>• Story and post fetching (every 20h)</li>
                                    <li>• Background job system with Bull/Redis</li>
                                    <li>• Unified chronological feed (stories + posts)</li>
                                    <li>• Video compression with FFmpeg</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Empty State */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-12 backdrop-blur-sm">
                        <div className="space-y-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                                <span className="text-4xl">📸</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white">No Stories Yet</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                Connect your Instagram account to start viewing stories and posts from people you care about
                            </p>
                            <button
                                disabled
                                className="mt-4 px-8 py-3 rounded-full bg-white/10 text-gray-500 font-medium cursor-not-allowed"
                            >
                                Connect Instagram (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
