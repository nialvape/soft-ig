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

        const { username, maxPosts = 12 } = await request.json();

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
        const { scrapeUserPosts } = await import("@/lib/scraper/post-scraper");
        const { downloadMedia } = await import("@/lib/scraper/story-scraper");

        // Decrypt session cookies
        const sessionCookies = decryptString(Buffer.from(user.instagramSession, 'base64'));

        // Scrape posts
        const result = await scrapeUserPosts(username, sessionCookies, maxPosts);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to scrape posts" },
                { status: 500 }
            );
        }

        // Download and encrypt media, then save to database
        const savedPosts = [];

        for (const post of result.posts) {
            try {
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

                // Generate carousel ID if it's a carousel
                const carouselId = post.mediaType === 'carousel'
                    ? `carousel_${post.id}`
                    : null;

                // Save each media item
                for (let i = 0; i < post.mediaUrls.length; i++) {
                    const mediaUrl = post.mediaUrls[i];

                    try {
                        // Download media
                        const mediaBuffer = await downloadMedia(mediaUrl);

                        // Encrypt media
                        const encryptedMedia = encrypt(mediaBuffer);

                        // Save post to database
                        const savedPost = await prisma.post.create({
                            data: {
                                followedAccountId: followedAccount.id,
                                instagramPostId: post.mediaType === 'carousel'
                                    ? `${post.id}_${i}`
                                    : post.id,
                                mediaType: post.mediaType,
                                carouselId,
                                carouselIndex: post.mediaType === 'carousel' ? i : null,
                                mediaData: encryptedMedia,
                                caption: i === 0 ? post.caption : null, // Only save caption once
                                postedAt: post.postedAt,
                            },
                        });

                        savedPosts.push(savedPost);
                    } catch (error) {
                        console.error('Error saving post media:', error);
                        continue;
                    }
                }
            } catch (error) {
                console.error('Error saving post:', error);
                continue;
            }
        }

        return NextResponse.json({
            success: true,
            postsFound: result.posts.length,
            mediaItemsSaved: savedPosts.length,
        });
    } catch (error) {
        console.error("Post scraping API error:", error);
        return NextResponse.json(
            { error: "Failed to scrape posts" },
            { status: 500 }
        );
    }
}
