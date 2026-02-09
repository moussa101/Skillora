'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const plans = [
    {
        id: 'FREE',
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for getting started',
        features: [
            '3 resume analyses per month',
            'Basic skill matching',
            'Job description comparison',
            'Email support',
        ],
        cta: 'Get Started',
        popular: false,
        gradient: 'from-gray-500 to-gray-600',
    },
    {
        id: 'PREMIUM',
        name: 'Premium',
        price: '$9.99',
        period: '/month',
        description: 'For serious job seekers',
        features: [
            'Unlimited resume analyses',
            'Advanced AI insights',
            'Skills gap analysis',
            'Resume scoring & tips',
            'Priority support',
            'Export detailed reports',
        ],
        cta: 'Start Free Trial',
        popular: true,
        gradient: 'from-[var(--accent)] to-purple-500',
    },
    {
        id: 'ORGANIZATION',
        name: 'Organization',
        price: 'Custom',
        period: 'pricing',
        description: 'For teams & recruiters',
        features: [
            'Everything in Premium',
            'Unlimited team members',
            'API access',
            'Bulk resume processing',
            'Custom integrations',
            'Dedicated account manager',
        ],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-orange-500 to-amber-500',
    },
];

export default function SelectPlanPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Get user type from previous step
        const storedUserType = sessionStorage.getItem('onboarding_userType');
        if (!storedUserType) {
            router.push('/onboarding/user-type');
            return;
        }
        setUserType(storedUserType);
    }, [router]);

    const handleComplete = async () => {
        if (!userType || !selected) return;
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, store selection and go to login
                sessionStorage.setItem('onboarding_plan', selected);
                router.push('/login?onboarding=pending');
                return;
            }

            const res = await fetch(`${API_URL}/auth/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userType,
                    plan: selected,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to complete onboarding');
            }

            // Update stored user data
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                localStorage.setItem('user', JSON.stringify({
                    ...user,
                    ...data.user,
                }));
            }

            // Clear onboarding session data
            sessionStorage.removeItem('onboarding_userType');
            sessionStorage.removeItem('onboarding_plan');

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
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
                        <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {plans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelected(plan.id)}
                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${selected === plan.id
                                    ? 'border-[var(--accent)] shadow-xl scale-[1.02]'
                                    : 'border-[var(--gray-200)] hover:border-[var(--gray-300)]'
                                    } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white text-xs font-semibold rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className={`inline-flex px-3 py-1 rounded-lg bg-gradient-to-r ${plan.gradient} text-white text-sm font-medium mb-4`}>
                                    {plan.name}
                                </div>

                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-[var(--foreground)]">{plan.price}</span>
                                    <span className="text-[var(--gray-500)]">{plan.period}</span>
                                </div>

                                <p className="text-[var(--gray-500)] mb-6">{plan.description}</p>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-[var(--gray-600)]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div
                                    className={`w-full py-3 rounded-xl font-medium text-center transition-all duration-300 ${selected === plan.id
                                        ? 'bg-[var(--accent)] text-white'
                                        : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
                                        }`}
                                >
                                    {plan.cta}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleComplete}
                            disabled={loading || !selected}
                            className="w-full max-w-md py-4 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-[var(--background)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Complete Setup
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => router.push('/onboarding/user-type')}
                            className="text-[var(--gray-500)] hover:text-[var(--foreground)] text-sm transition-colors"
                        >
                            ← Go back
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
