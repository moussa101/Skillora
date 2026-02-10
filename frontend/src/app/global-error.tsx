"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    background: "#000",
                    color: "#fff",
                }}>
                    <div style={{ textAlign: "center", maxWidth: 480, padding: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
                        <p style={{ color: "#888", marginBottom: 24 }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                background: "#fff",
                                color: "#000",
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
            </body>
        </html>
    );
}
