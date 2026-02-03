'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'code' | 'password'>('code');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) {
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
            }
        } else {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);
            if (value && index < 5) {
                inputs.current[index + 1]?.focus();
            }
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code: code.join(''),
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Reset failed');

            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
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
                        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                        <p className="text-[var(--gray-500)]">
                            {step === 'code' ? 'Enter the verification code sent to your email.' : 'Enter your new password.'}
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        {!initialEmail && (
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
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--gray-700)] mb-3">
                                Verification Code
                            </label>
                            <div className="flex justify-between gap-2">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => { inputs.current[index] = el }}
                                        type="text"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleCodeChange(index, e.target.value)}
                                        onKeyDown={e => handleCodeKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-[var(--gray-200)] bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
                                    placeholder="Repeat new password"
                                />
                            </div>
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
                            type="submit"
                            disabled={loading || code.some(c => !c)}
                            className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
