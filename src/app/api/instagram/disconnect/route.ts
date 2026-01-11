import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Clear Instagram credentials
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                instagramUsername: null,
                instagramSession: null,
                sessionExpiresAt: null,
                has2FA: false,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Instagram account disconnected",
        });
    } catch (error) {
        console.error("Instagram disconnection error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect Instagram account" },
            { status: 500 }
        );
    }
}
