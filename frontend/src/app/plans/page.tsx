"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const plans = [
    {
        id: "free",
        tier: "GUEST",
        name: "Free",
        price: "0",
        currency: "EGP",
        period: "/month",
        description: "Get started with basic resume analysis",
        color: "var(--gray-500)",
        bgColor: "rgba(142,142,147,0.08)",
        borderColor: "rgba(142,142,147,0.2)",
        features: [
            "5 analyses per month",
            "Basic skill matching",
            "Resume score",
            "Missing keywords detection",
            "PDF, DOCX, TXT support",
        ],
        limitations: [
            "No AI critique",
            "No ATS scoring",
            "No profile analysis",
            "No batch processing",
        ],
        cta: "Current Plan",
        popular: false,
    },
    {
        id: "premium",
        tier: "PRO",
        name: "Premium",
        price: "350",
        currency: "EGP",
        period: "/month",
        description: "Full power for serious job seekers",
        color: "var(--accent)",
        bgColor: "rgba(0,122,255,0.08)",
        borderColor: "rgba(0,122,255,0.3)",
        features: [
            "Unlimited analyses",
            "Advanced AI critique & suggestions",
            "ATS compatibility scoring",
            "GitHub & LinkedIn profile analysis",
            "Multi-language support",
            "PDF export",
            "Priority support",
        ],
        limitations: [],
        cta: "Upgrade to Premium",
        popular: true,
    },
    {
        id: "recruiter",
        tier: "RECRUITER",
        name: "Recruiter",
        price: "500",
        currency: "EGP",
        period: "/month",
        description: "Built for hiring teams and recruiters",
        color: "var(--success)",
        bgColor: "rgba(52,199,89,0.08)",
        borderColor: "rgba(52,199,89,0.3)",
        features: [
            "1,000 analyses per month",
            "Batch processing (up to 50 resumes)",
            "Candidate ranking & comparison",
            "ATS + AI critique for all candidates",
            "CSV export of results",
            "Team dashboard",
            "API access",
            "Dedicated support",
        ],
        limitations: [],
        cta: "Get Recruiter Plan",
        popular: false,
    },
];

export default function PlansPage() {
    const { user, loading } = useAuth();

    const currentTier = user?.tier || "GUEST";

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                        Skillora
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link
                                    href={user.role === "ADMIN" ? "/admin" : user.role === "RECRUITER" || user.tier === "RECRUITER" ? "/recruiter" : "/dashboard"}
                                    className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
                                >
                                    {user.role === "ADMIN" ? "Admin" : user.role === "RECRUITER" || user.tier === "RECRUITER" ? "Recruiter Panel" : "Dashboard"}
                                </Link>
                                <Link href="/profile" className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors">
                                    Profile
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors">
                                    Sign in
                                </Link>
                                <Link href="/signup" className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-hover)] transition-colors">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-semibold text-[var(--foreground)] tracking-tight mb-3">
                        Choose your plan
                    </h1>
                    <p className="text-lg text-[var(--gray-500)] max-w-lg mx-auto">
                        From free analysis to full recruiter tools — pick what fits your needs.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {plans.map((plan) => {
                        const isCurrent = currentTier === plan.tier;
                        return (
                            <div
                                key={plan.id}
                                className="relative rounded-2xl p-[1px] transition-all"
                                style={{
                                    background: plan.popular
                                        ? "linear-gradient(135deg, var(--accent), #5856d6)"
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
                                    style={{ background: "var(--background)" }}
                                >
                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ background: plan.color }}
                                            />
                                            <h3 className="text-lg font-semibold text-[var(--foreground)]">
                                                {plan.name}
                                            </h3>
                                            {isCurrent && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--gray-100)] text-[var(--gray-500)]">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--gray-500)] mb-4">
                                            {plan.description}
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-[var(--foreground)]">
                                                {plan.price}
                                            </span>
                                            <span className="text-sm text-[var(--gray-500)]">
                                                {plan.currency}{plan.period}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-3">
                                            What&apos;s included
                                        </div>
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

                                    {/* CTA */}
                                    <button
                                        disabled={isCurrent}
                                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                                            isCurrent
                                                ? "bg-[var(--gray-100)] text-[var(--gray-400)] cursor-default"
                                                : plan.popular
                                                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-100"
                                                    : "border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)] hover:scale-[1.02] active:scale-100"
                                        }`}
                                    >
                                        {isCurrent ? "Current Plan" : plan.cta}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ */}
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <FaqItem
                            q="Can I change my plan anytime?"
                            a="Yes! You can upgrade or downgrade at any time. Changes take effect immediately and your billing adjusts accordingly."
                        />
                        <FaqItem
                            q="What payment methods do you accept?"
                            a="We accept all major credit/debit cards and popular Egyptian payment methods including Vodafone Cash, Fawry, and bank transfers."
                        />
                        <FaqItem
                            q="Is there a free trial for Premium?"
                            a="The Free plan lets you try the core features with 5 analyses per month. Upgrade to Premium when you need unlimited access and advanced tools."
                        />
                        <FaqItem
                            q="What does the Recruiter plan include?"
                            a="The Recruiter plan adds batch processing for up to 50 resumes at once, candidate ranking, CSV export, and API access for integration with your existing tools."
                        />
                        <FaqItem
                            q="Do unused analyses roll over?"
                            a="No, analysis counts reset at the beginning of each billing cycle. Premium users enjoy unlimited analyses so this doesn't apply."
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-[var(--gray-400)] text-sm border-t border-[var(--gray-200)]">
                <p>Skillora - AI-Powered Resume Analysis</p>
            </footer>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    return (
        <details className="group glass-card apple-shadow rounded-xl">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="text-sm font-medium text-[var(--foreground)]">{q}</span>
                <svg
                    className="w-4 h-4 text-[var(--gray-400)] transition-transform group-open:rotate-180"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div className="px-4 pb-4 text-sm text-[var(--gray-500)] leading-relaxed">
                {a}
            </div>
        </details>
    );
}
