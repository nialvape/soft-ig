"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TwoFactorModal from "@/components/modals/TwoFactorModal";

interface InstagramConnectionFormProps {
    isConnected: boolean;
    currentUsername?: string;
}

export default function InstagramConnectionForm({ isConnected, currentUsername }: InstagramConnectionFormProps) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [show2FAModal, setShow2FAModal] = useState(false);

    const handleConnect = async (e: React.FormEvent, twoFactorCode?: string) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch("/api/instagram/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, twoFactorCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.requires2FA && !twoFactorCode) {
                    // Show 2FA modal
                    setShow2FAModal(true);
                    setLoading(false);
                    return;
                }

                setError(data.error || "Connection failed");
                setShow2FAModal(false);
                return;
            }

            setSuccess("Instagram account connected successfully!");
            setUsername("");
            setPassword("");
            setShow2FAModal(false);

            // Refresh the page to show updated status
            setTimeout(() => {
                router.refresh();
            }, 1500);
        } catch (error) {
            setError("An error occurred. Please try again.");
            setShow2FAModal(false);
        } finally {
            setLoading(false);
        }
    };

    const handle2FASubmit = (code: string) => {
        const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
        handleConnect(fakeEvent, code);
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect your Instagram account?")) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/instagram/disconnect", {
                method: "POST",
            });

            if (!response.ok) {
                setError("Failed to disconnect");
                return;
            }

            setSuccess("Instagram account disconnected");
            setTimeout(() => {
                router.refresh();
            }, 1500);
        } catch (error) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (isConnected) {
        return (
            <div className="space-y-4">
                {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                        <p className="text-sm text-green-400">{success}</p>
                    </div>
                )}

                <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="w-full rounded-full border border-red-500/20 text-red-400 px-6 py-3 font-medium hover:bg-red-500/10 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                    {loading ? "Disconnecting..." : "Disconnect Instagram"}
                </button>
            </div>
        );
    }

    return (
        <>
            <TwoFactorModal
                isOpen={show2FAModal}
                onSubmit={handle2FASubmit}
                onCancel={() => {
                    setShow2FAModal(false);
                    setLoading(false);
                }}
                loading={loading}
            />

            <form onSubmit={handleConnect} className="space-y-4">
                {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                        <p className="text-sm text-green-400">{success}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Instagram Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />

                    <input
                        type="password"
                        placeholder="Instagram Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-white text-black px-6 py-3.5 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                    {loading ? "Connecting..." : "Connect Instagram"}
                </button>

                <p className="text-xs text-gray-400 text-center">
                    Your credentials are encrypted with AES-256-GCM and stored securely
                </p>
            </form>
        </>
    );
}
