import Link from "next/link";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8">
            <div className="w-full max-w-2xl space-y-12">
                {/* Branding */}
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-bold text-white tracking-tight">Soft-IG</h1>
                    <p className="text-lg text-gray-400">
                        Simple, Quiet, Brained Fighter
                    </p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Instagram Alternative for Healthier Content Consumption
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid gap-4">
                    {/* Phase 1 Complete */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-xl">✓</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Phase 1: Foundation</h2>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-2 ml-13">
                            <li>• Next.js 14+ with TypeScript</li>
                            <li>• Prisma ORM with PostgreSQL</li>
                            <li>• AES-256-GCM Encryption</li>
                            <li>• Docker Compose Setup</li>
                            <li>• PWA Configuration</li>
                        </ul>
                    </div>

                    {/* Phase 2 Complete */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-xl">✓</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Phase 2: Authentication</h2>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-2 ml-13">
                            <li>• User Registration & Login</li>
                            <li>• Protected Routes</li>
                            <li>• Database Sessions</li>
                            <li>• Password Hashing (bcrypt)</li>
                        </ul>
                    </div>

                    {/* Next Phase */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-400 text-xl">→</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Phase 3: Coming Soon</h2>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-2 ml-13">
                            <li>• Playwright Scraper</li>
                            <li>• Instagram Connection</li>
                            <li>• Story & Post Fetching</li>
                            <li>• Background Jobs</li>
                        </ul>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/login"
                        className="flex-1 rounded-full bg-white text-black px-8 py-4 font-semibold text-center hover:bg-gray-100 transition-all active:scale-[0.98]"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="flex-1 rounded-full border border-white/20 text-white px-8 py-4 font-semibold text-center hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    );
}
