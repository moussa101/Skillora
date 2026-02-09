'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const INSTAPAY_NUMBER = '01276296669';

const plans = [
    {
        id: 'FREE',
        tier: 'GUEST',
        name: 'Free',
        price: '0',
        currency: 'EGP',
        period: '/month',
        description: 'Get started with basic resume analysis',
        color: 'var(--gray-500)',
        borderColor: 'rgba(142,142,147,0.2)',
        features: [
            '5 analyses per month',
            'Skill matching & resume score',
            'Missing keywords detection',
            'AI critique & suggestions',
            'ATS compatibility scoring',
            'PDF, DOCX, TXT support',
            'Multi-language support',
        ],
        limitations: [
            'No batch processing',
            'No PDF export',
        ],
        cta: 'Start Free',
        popular: false,
    },
    {
        id: 'PREMIUM',
        tier: 'PRO',
        name: 'Premium',
        price: '350',
        currency: 'EGP',
        period: '/month',
        description: 'Full power for serious job seekers',
        color: 'var(--accent)',
        borderColor: 'rgba(0,122,255,0.3)',
        features: [
            'Unlimited analyses',
            'AI critique & suggestions',
            'ATS compatibility scoring',
            'GitHub & LinkedIn profile analysis',
            'Multi-language support',
            'PDF export (coming soon)',
            'Priority support',
        ],
        limitations: [],
        cta: 'Upgrade to Premium',
        popular: true,
    },
    {
        id: 'ORGANIZATION',
        tier: 'RECRUITER',
        name: 'Recruiter',
        price: '500',
        currency: 'EGP',
        period: '/month',
        description: 'Built for hiring teams and recruiters',
        color: 'var(--success)',
        borderColor: 'rgba(52,199,89,0.3)',
        features: [
            '1,000 analyses per month',
            'Batch processing (up to 50 resumes)',
            'Candidate ranking & comparison',
            'ATS + AI critique for all candidates',
            'CSV export of results',
            'Team dashboard (coming soon)',
            'API access (coming soon)',
            'Dedicated support',
        ],
        limitations: [],
        cta: 'Get Recruiter Plan',
        popular: false,
    },
];

export default function SelectPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const storedUserType = sessionStorage.getItem('onboarding_userType');
        if (!storedUserType) {
            router.push('/onboarding/user-type');
            return;
        }
        setUserType(storedUserType);
    }, [router]);

    const getToken = () => localStorage.getItem('token');

    const completeOnboarding = async (plan: string) => {
        if (!userType) return;
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            if (!token) {
                sessionStorage.setItem('onboarding_plan', plan);
                router.push('/login?onboarding=pending');
                return;
            }
            const res = await fetch(`${API_URL}/auth/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userType, plan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to complete onboarding');

            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                localStorage.setItem('user', JSON.stringify({ ...user, ...data.user }));
            }
            sessionStorage.removeItem('onboarding_userType');
            sessionStorage.removeItem('onboarding_plan');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanClick = (plan: typeof plans[0]) => {
        if (plan.id === 'FREE') {
            completeOnboarding('FREE');
            return;
        }
        // For paid plans, show payment modal
        setSelectedPlan(plan);
        setScreenshot(null);
        setMessage(null);
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async () => {
        if (!screenshot || !selectedPlan || !userType) return;
        setSubmitting(true);
        setMessage(null);
        try {
            // First complete onboarding with FREE to mark it done
            const token = getToken();
            if (!token) {
                router.push('/login?onboarding=pending');
                return;
            }
            await fetch(`${API_URL}/auth/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userType, plan: 'FREE' }),
            });

            // Then submit payment screenshot for the upgrade
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            formData.append('plan', selectedPlan.tier);
            formData.append('paymentMethod', 'instapay');
            const res = await fetch(`${API_URL}/subscriptions/request`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Payment submitted! Your plan will be activated once confirmed by admin.' });
                // Update stored user
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    localStorage.setItem('user', JSON.stringify({ ...user, onboardingComplete: true }));
                }
                sessionStorage.removeItem('onboarding_userType');
                sessionStorage.removeItem('onboarding_plan');
                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                setMessage({ type: 'error', text: data.message || data.error || 'Failed to submit payment' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 flex justify-between items-center">
                <Link href="/" className="text-[var(--foreground)] font-semibold text-xl tracking-tight">
                    Skillora
                </Link>
                <span className="text-sm text-[var(--gray-400)]">Step 2 of 2</span>
            </nav>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
                            Choose your plan
                        </h1>
                        <p className="text-[var(--gray-500)] text-lg">
                            Start free and upgrade anytime
                        </p>
                    </div>

                    {error && (
                        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl text-sm text-center border border-red-300" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className="relative rounded-2xl p-[1px] transition-all"
                                style={{
                                    background: plan.popular
                                        ? 'linear-gradient(135deg, var(--accent), #5856d6)'
                                        : plan.borderColor,
                                }}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-[#5856d6]">
                                        Most Popular
                                    </div>
                                )}
                                <div
                                    className="rounded-2xl p-6 h-full flex flex-col"
                                    style={{ background: 'var(--background)' }}
                                >
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: plan.color }} />
                                            <h3 className="text-lg font-semibold text-[var(--foreground)]">{plan.name}</h3>
                                        </div>
                                        <p className="text-sm text-[var(--gray-500)] mb-4">{plan.description}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-[var(--foreground)]">{plan.price}</span>
                                            <span className="text-sm text-[var(--gray-500)]">{plan.currency}{plan.period}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-3">What&apos;s included</div>
                                        <ul className="space-y-2.5 mb-4">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        {plan.limitations.length > 0 && (
                                            <ul className="space-y-2 mb-4">
                                                {plan.limitations.map((limitation, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--gray-400)]">
                                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        {limitation}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePlanClick(plan)}
                                        disabled={loading}
                                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                                            plan.popular
                                                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-100'
                                                : plan.id === 'FREE'
                                                    ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                                                    : 'border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)] hover:scale-[1.02] active:scale-100'
                                        } disabled:opacity-50`}
                                    >
                                        {loading && plan.id === 'FREE' ? 'Setting up...' : plan.cta}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => router.push('/onboarding/user-type')}
                            className="text-[var(--gray-500)] hover:text-[var(--foreground)] text-sm transition-colors"
                        >
                            \u2190 Go back
                        </button>
                    </div>
                </div>
            </main>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-[var(--background)] border border-[var(--gray-200)] p-6 max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-4 right-4 text-[var(--gray-400)] hover:text-[var(--foreground)]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">
                            Upgrade to {selectedPlan.name}
                        </h2>
                        <p className="text-sm text-[var(--gray-500)] mb-6">
                            {selectedPlan.price} {selectedPlan.currency}/month
                        </p>

                        <div className="p-4 rounded-xl bg-[var(--gray-100)] border border-[var(--gray-200)] mb-6">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Payment Instructions</h3>
                            <ol className="space-y-3 text-sm text-[var(--gray-600)]">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-[var(--accent)]">1.</span>
                                    <span>Open your bank app or InstaPay</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-[var(--accent)]">2.</span>
                                    <span>Send <span className="font-bold text-[var(--foreground)]">{selectedPlan.price} EGP</span> to:</span>
                                </li>
                            </ol>
                            <div className="mt-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--gray-300)] text-center">
                                <p className="text-xs text-[var(--gray-500)] mb-1">InstaPay Number</p>
                                <p className="text-2xl font-mono font-bold text-[var(--foreground)] tracking-wider">{INSTAPAY_NUMBER}</p>
                            </div>
                            <p className="mt-3 text-xs text-[var(--gray-500)]">
                                After sending, take a screenshot of the successful transfer confirmation.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Upload Payment Screenshot</label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                className="w-full text-sm text-[var(--gray-500)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--gray-100)] file:text-[var(--accent)] hover:file:bg-[var(--gray-200)] cursor-pointer"
                            />
                            {screenshot && (
                                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg border border-green-300" style={{ background: 'rgba(34,197,94,0.08)' }}>
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-xs text-green-700 truncate">{screenshot.name}</span>
                                    <span className="text-xs text-green-500">({(screenshot.size / 1024).toFixed(0)} KB)</span>
                                </div>
                            )}
                        </div>

                        {message && (
                            <div className={`mb-4 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}`} style={{ background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                                {message.text}
                            </div>
                        )}

                        <button
                            onClick={handleSubmitPayment}
                            disabled={!screenshot || submitting}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${!screenshot || submitting ? 'bg-[var(--gray-200)] text-[var(--gray-400)] cursor-not-allowed' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'}`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Payment Proof'}
                        </button>
                        <p className="mt-3 text-center text-xs text-[var(--gray-400)]">
                            Your subscription will be activated after admin confirmation
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
