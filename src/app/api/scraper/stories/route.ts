import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptString, encrypt } from "@/lib/encryption";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        // Get user's Instagram session
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                instagramSession: true,
                instagramUsername: true,
            },
        });

        if (!user?.instagramSession) {
            return NextResponse.json(
                { error: "Instagram account not connected" },
                { status: 400 }
            );
        }

        // Import scraper (dynamic to avoid issues)
        const { scrapeUserStories, downloadMedia } = await import("@/lib/scraper/story-scraper");

        // Decrypt session cookies
        const sessionCookies = decryptString(Buffer.from(user.instagramSession, 'base64'));

        // Scrape stories
        const result = await scrapeUserStories(username, sessionCookies);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to scrape stories" },
                { status: 500 }
            );
        }

        // Download and encrypt media, then save to database
        const savedStories = [];

        for (const story of result.stories) {
            try {
                // Download media
                const mediaBuffer = await downloadMedia(story.mediaUrl);

                // Encrypt media
                const encryptedMedia = encrypt(mediaBuffer);

                // Find or create followed account
                let followedAccount = await prisma.followedAccount.findFirst({
                    where: {
                        userId: session.user.id,
                        instagramHandle: username,
                    },
                });

                if (!followedAccount) {
                    followedAccount = await prisma.followedAccount.create({
                        data: {
                            userId: session.user.id,
                            instagramHandle: username,
                            displayName: username,
                        },
                    });
                }

                // Save story to database
                const savedStory = await prisma.story.create({
                    data: {
                        followedAccountId: followedAccount.id,
                        instagramStoryId: story.id,
                        mediaType: story.mediaType,
                        mediaData: encryptedMedia,
                        postedAt: story.postedAt,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    },
                });

                savedStories.push(savedStory);
            } catch (error) {
                console.error('Error saving story:', error);
                continue;
            }
        }

        return NextResponse.json({
            success: true,
            storiesFound: result.stories.length,
            storiesSaved: savedStories.length,
        });
    } catch (error) {
        console.error("Story scraping API error:", error);
        return NextResponse.json(
            { error: "Failed to scrape stories" },
            { status: 500 }
        );
    }
}
