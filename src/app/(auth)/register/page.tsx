"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            // Registration successful, redirect to login
            router.push("/login?registered=true");
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8">
            <div className="w-full max-w-sm space-y-8">
                {/* Branding */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-bold text-white tracking-tight">Soft-IG</h1>
                    <p className="text-sm text-gray-400">
                        Simple, Quiet, Brained Fighter
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <input
                            id="name"
                            type="text"
                            placeholder="Name (optional)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />

                        <input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />

                        <input
                            id="password"
                            type="password"
                            placeholder="Password (min 8 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />

                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3.5 text-white placeholder:text-gray-500 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-white text-black px-6 py-3.5 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {loading ? "Creating account..." : "Set Up"}
                    </button>

                    <p className="text-center text-sm text-gray-400 pt-2">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
