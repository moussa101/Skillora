"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page error:", error);
    }, [error]);

    return (
        <div style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
            <div style={{ textAlign: "center", maxWidth: 480, padding: 32 }}>
                <h2 style={{
                    fontSize: 24,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "var(--foreground, #fff)",
                }}>
                    Something went wrong
                </h2>
                <p style={{
                    color: "var(--gray-500, #888)",
                    marginBottom: 24,
                    fontSize: 14,
                }}>
                    We encountered an error loading this page. Please try again.
                </p>
                <button
                    onClick={reset}
                    style={{
                        background: "var(--foreground, #fff)",
                        color: "var(--background, #000)",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
