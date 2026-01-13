import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const type = searchParams.get('type'); // 'story' or 'post'

        if (!username) {
            return NextResponse.json({ error: "Username required" }, { status: 400 });
        }

        // Find followed account
        const followedAccount = await prisma.followedAccount.findFirst({
            where: {
                userId: session.user.id,
                instagramHandle: username,
            },
        });

        if (!followedAccount) {
            return NextResponse.json({ stories: [], posts: [] });
        }

        if (type === 'story') {
            // Get recent stories
            const stories = await prisma.story.findMany({
                where: {
                    followedAccountId: followedAccount.id,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                orderBy: {
                    postedAt: 'desc',
                },
                take: 10,
            });

            // Decrypt media and convert to data URLs for preview
            const previewStories = stories.map(story => {
                try {
                    const decryptedMedia = decrypt(story.mediaData);
                    const base64 = decryptedMedia.toString('base64');
                    const mimeType = story.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
                    const dataUrl = `data:${mimeType};base64,${base64}`;

                    return {
                        id: story.id,
                        mediaUrl: dataUrl,
                        mediaType: story.mediaType,
                        username: username,
                    };
                } catch (error) {
                    console.error('Error decrypting story:', error);
                    return null;
                }
            }).filter(Boolean);

            return NextResponse.json({ stories: previewStories });
        }

        return NextResponse.json({ stories: [], posts: [] });
    } catch (error) {
        console.error("Preview API error:", error);
        return NextResponse.json(
            { error: "Failed to load preview" },
            { status: 500 }
        );
    }
}
