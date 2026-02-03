'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to send reset code');

            setSuccess('If an account exists, a reset code has been sent to your email.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-[var(--surface)] border border-[var(--gray-200)] rounded-2xl p-8 shadow-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
                        <p className="text-[var(--gray-500)]">
                            Enter your email address and we'll send you a code to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="space-y-4">
                                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl">
                                    {success}
                                </div>
                                <Link
                                    href={`/reset-password?email=${encodeURIComponent(email)}`}
                                    className="block w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium text-center hover:opacity-90 transition-opacity"
                                >
                                    Enter Reset Code
                                </Link>
                            </div>
                        )}

                        {!success && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Send Reset Code'
                                )}
                            </button>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-[var(--gray-500)] hover:text-[var(--foreground)] transition-colors">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
