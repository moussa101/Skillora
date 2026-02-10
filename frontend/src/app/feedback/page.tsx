"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FeedbackPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    rating: parseInt(rating.toString()),
                    message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit feedback");
            }

            setSuccess("Thank you for your feedback! We appreciate your input.");
            // Reset form
            setName("");
            setEmail("");
            setRating(5);
            setMessage("");

            // Redirect to home after 2 seconds
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 flex justify-between items-center">
                <Link href="/" className="text-[var(--foreground)] font-semibold text-xl tracking-tight">
                    Skillora
                </Link>
                <Link href="/" className="text-[var(--accent)] text-sm font-medium hover:underline">
                    Back to Home
                </Link>
            </nav>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold text-[var(--foreground)] mb-2">We'd love to hear from you</h1>
                        <p className="text-[var(--gray-500)]">Share your thoughts about Skillora and help us improve</p>
                    </div>

                    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl border border-[var(--gray-200)] p-8 shadow-sm">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-[var(--gray-100)] border border-[var(--gray-200)] rounded-xl text-[var(--foreground)] placeholder-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                                    placeholder="Your name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-[var(--gray-100)] border border-[var(--gray-200)] rounded-xl text-[var(--foreground)] placeholder-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                                    How would you rate Skillora?
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <svg
                                                className={`w-10 h-10 ${
                                                    star <= rating
                                                        ? "text-yellow-400 fill-current"
                                                        : "text-[var(--gray-300)] stroke-current fill-none"
                                                }`}
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                            >
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--gray-400)] mt-2">
                                    {rating === 1 && "Poor"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Very Good"}
                                    {rating === 5 && "Excellent"}
                                </p>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Your feedback
                                </label>
                                <textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 bg-[var(--gray-100)] border border-[var(--gray-200)] rounded-xl text-[var(--foreground)] placeholder-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all resize-none"
                                    placeholder="Tell us what you think about Skillora. What features do you love? What could be improved?"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--accent)] text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </form>
                    </div>

                    {/* Privacy Note */}
                    <p className="text-center text-xs text-[var(--gray-400)] mt-6">
                        Your feedback helps us improve Skillora. We respect your privacy and will never share your information.
                    </p>
                </div>
            </main>
        </div>
    );
}
