"use client";

import { useState } from "react";

interface TwoFactorModalProps {
    isOpen: boolean;
    onSubmit: (code: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function TwoFactorModal({ isOpen, onSubmit, onCancel, loading }: TwoFactorModalProps) {
    const [code, setCode] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length === 6) {
            onSubmit(code);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-black border border-white/20 p-6 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 mx-auto flex items-center justify-center">
                        <span className="text-3xl">🔐</span>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
                        <p className="text-sm text-gray-400 mt-2">
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            className="w-full text-center text-2xl tracking-widest rounded-xl border-0 bg-white/10 px-4 py-4 text-white placeholder:text-gray-600 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 rounded-full border border-white/20 text-white px-6 py-3 font-medium hover:bg-white/5 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="flex-1 rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                {loading ? "Verifying..." : "Submit"}
                            </button>
                        </div>
                    </form>

                    <p className="text-xs text-gray-500">
                        This code is required by Instagram's security
                    </p>
                </div>
            </div>
        </div>
    );
}
