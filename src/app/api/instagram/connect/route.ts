import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptString } from "@/lib/encryption";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username, password, twoFactorCode } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Import Instagram login service (dynamic import to avoid issues)
        const { loginToInstagram } = await import("@/lib/scraper/instagram-login");

        // Attempt to login to Instagram with Playwright
        const loginResult = await loginToInstagram(username, password, twoFactorCode);

        if (!loginResult.success) {
            if (loginResult.requires2FA) {
                return NextResponse.json(
                    { error: "2FA required", requires2FA: true },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: loginResult.error || "Instagram login failed" },
                { status: 400 }
            );
        }

        // Login successful - store encrypted session
        const encryptedSession = encryptString(loginResult.sessionCookies!);

        // Update user with Instagram credentials
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                instagramUsername: username,
                instagramSession: encryptedSession.toString('base64'),
                sessionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                has2FA: !!twoFactorCode,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Instagram account connected successfully",
        });
    } catch (error) {
        console.error("Instagram connection error:", error);
        return NextResponse.json(
            { error: "Failed to connect Instagram account" },
            { status: 500 }
        );
    }
}
