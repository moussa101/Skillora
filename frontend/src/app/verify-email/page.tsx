'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            router.push('/login');
        }
    }, [email, router]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedCode = value.slice(0, 6).split('');
            const newCode = [...code];
            pastedCode.forEach((digit, i) => {
                if (index + i < 6) newCode[index + i] = digit;
            });
            setCode(newCode);
            if (index + pastedCode.length < 6) {
                inputs.current[index + pastedCode.length]?.focus();
            } else {
                inputs.current[5]?.focus();
                handleVerify(newCode.join(''));
            }
        } else {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Auto focus next unit
            if (value && index < 5) {
                inputs.current[index + 1]?.focus();
            }

            // Auto verify if complete
            if (value && index === 5 && newCode.every(c => c)) {
                handleVerify(newCode.join(''));
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (verificationCode: string) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Verification failed');

            setSuccess('Email verified successfully! Redirecting...');
            setTimeout(() => router.push('/onboarding/user-type'), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to resend code');

            setSuccess('Verification code resent successfully!');
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
                        <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
                        <p className="text-[var(--gray-500)]">
                            We've sent a code to <span className="font-medium text-[var(--foreground)]">{email}</span>
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between gap-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => { inputs.current[index] = el }}
                                    type="text"
                                    maxLength={6}
                                    value={digit}
                                    onChange={e => handleChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    disabled={loading || !!success}
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-[var(--gray-200)] bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl text-center">
                                {success}
                            </div>
                        )}

                        <button
                            onClick={() => handleVerify(code.join(''))}
                            disabled={loading || code.some(c => !c)}
                            className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <div className="text-center text-sm text-[var(--gray-500)]">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={loading}
                                className="text-[var(--accent)] hover:underline disabled:opacity-50"
                            >
                                Resend
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-[var(--gray-500)] hover:text-[var(--foreground)] transition-colors">
                                Back to sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
