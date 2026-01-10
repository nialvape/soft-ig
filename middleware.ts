import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Auth pages
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

    // Protected pages
    const isProtectedPage =
        pathname.startsWith("/feed") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/following");

    // Redirect to login if accessing protected page without auth
    if (isProtectedPage && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect to feed if accessing auth pages while logged in
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/feed", req.url));
    }

    return NextResponse.next();
}) as any;

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
