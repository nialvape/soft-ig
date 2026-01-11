import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InstagramConnectionForm from "@/components/settings/InstagramConnectionForm";

export default async function SettingsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            instagramUsername: true,
            has2FA: true,
            wrappedPeriodicity: true,
            maxFollowedAccounts: true,
        },
    });

    const isConnected = !!user?.instagramUsername;

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                    <a
                        href="/feed"
                        className="text-sm px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
                    >
                        Back to Feed
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-12">
                <div className="space-y-6">
                    {/* Instagram Connection */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-12 h-12 rounded-full ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                                <span className={`text-2xl ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                                    {isConnected ? '✓' : '📸'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Instagram Account</h2>
                                <p className="text-sm text-gray-400">
                                    {isConnected ? `Connected as @${user.instagramUsername}` : 'Not connected'}
                                </p>
                            </div>
                        </div>

                        <InstagramConnectionForm
                            isConnected={isConnected}
                            currentUsername={user?.instagramUsername || undefined}
                        />
                    </div>

                    {/* Preferences */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/10">
                                <div>
                                    <p className="text-white font-medium">Wrapped Periodicity</p>
                                    <p className="text-sm text-gray-400">How often to fetch posts</p>
                                </div>
                                <span className="text-white capitalize">{user?.wrappedPeriodicity}</span>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-white/10">
                                <div>
                                    <p className="text-white font-medium">Max Followed Accounts</p>
                                    <p className="text-sm text-gray-400">Limit for Instagram accounts</p>
                                </div>
                                <span className="text-white">{user?.maxFollowedAccounts}</span>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-white font-medium">2FA Status</p>
                                    <p className="text-sm text-gray-400">Two-factor authentication</p>
                                </div>
                                <span className={`text-sm px-3 py-1 rounded-full ${user?.has2FA ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {user?.has2FA ? 'Enabled' : 'Not detected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 backdrop-blur-sm">
                        <h3 className="text-white font-semibold mb-2">ℹ️ How it works</h3>
                        <ul className="text-sm text-blue-200 space-y-2">
                            <li>• Your Instagram credentials are encrypted with AES-256-GCM</li>
                            <li>• Stories are fetched every 20 hours automatically</li>
                            <li>• Posts are fetched based on your periodicity setting</li>
                            <li>• If 2FA is enabled, you'll be prompted for codes when needed</li>
                            <li>• Maximum 15 accounts can be followed per user</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
