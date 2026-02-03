"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Store the token
            localStorage.setItem("token", token);

            // Fetch user info
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => res.json())
                .then((user) => {
                    localStorage.setItem("user", JSON.stringify(user));
                    router.push("/dashboard");
                })
                .catch(() => {
                    router.push("/dashboard");
                });
        } else {
            // No token, redirect to login
            router.push("/login");
        }
    }, [router, searchParams]);

    return (
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--gray-500)]">Completing sign in...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <Suspense fallback={
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--gray-500)]">Loading...</p>
                </div>
            }>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}
