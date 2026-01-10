"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/feed");
                router.refresh();
            }
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
                            placeholder="Password"
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
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <p className="text-center text-sm text-gray-400 pt-2">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-white hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
