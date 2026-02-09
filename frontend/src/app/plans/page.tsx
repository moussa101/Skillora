"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const INSTAPAY_NUMBER = "01276296669";

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
            "Skill matching & resume score",
            "Missing keywords detection",
            "AI critique & suggestions",
            "ATS compatibility scoring",
            "PDF, DOCX, TXT support",
            "Multi-language support",
        ],
        limitations: [
            "No batch processing",
            "No PDF export",
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
            "AI critique & suggestions",
            "ATS compatibility scoring",
            "GitHub & LinkedIn profile analysis",
            "Multi-language support",
            "PDF export (coming soon)",
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
            "Team dashboard (coming soon)",
            "API access (coming soon)",
            "Dedicated support",
        ],
        limitations: [],
        cta: "Get Recruiter Plan",
        popular: false,
    },
];

interface SubInfo {
    active: { id: number; plan: string; startDate: string; endDate: string; status: string } | null;
    pending: { id: number; plan: string; status: string; createdAt: string } | null;
}

export default function PlansPage() {
    const { user, refreshUser } = useAuth();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [subInfo, setSubInfo] = useState<SubInfo | null>(null);

    const currentTier = user?.tier || "GUEST";
    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        if (user) fetchSubInfo();
    }, [user]);

    const fetchSubInfo = async () => {
        try {
            const res = await fetch(`${API_URL}/subscriptions/my`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) setSubInfo(await res.json());
        } catch { /* ignore */ }
    };

    const handleUpgrade = (plan: typeof plans[0]) => {
        if (!user) { window.location.href = "/login"; return; }
        setSelectedPlan(plan);
        setScreenshot(null);
        setMessage(null);
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async () => {
        if (!screenshot || !selectedPlan) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append("screenshot", screenshot);
            formData.append("plan", selectedPlan.tier);
            formData.append("paymentMethod", "instapay");
            const res = await fetch(`${API_URL}/subscriptions/request`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "Payment screenshot submitted! Your subscription will be activated once the admin confirms your payment." });
                setScreenshot(null);
                await fetchSubInfo();
                await refreshUser();
            } else {
                setMessage({ type: "error", text: data.message || data.error || "Failed to submit payment" });
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

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

                {/* Pending/Active Subscription Banner */}
                {subInfo?.pending && (
                    <div className="mb-8 p-4 rounded-xl border border-yellow-300 bg-yellow-50" style={{ background: "rgba(250,204,21,0.08)" }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-600" style={{ background: "rgba(250,204,21,0.15)" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Payment Under Review</p>
                                <p className="text-xs text-yellow-600">
                                    Your {subInfo.pending.plan === "PRO" ? "Premium" : "Recruiter"} plan payment is being reviewed by our team. We&apos;ll activate your account shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {subInfo?.active && subInfo.active.endDate && (
                    <div className="mb-8 p-4 rounded-xl border border-green-300" style={{ background: "rgba(34,197,94,0.08)" }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-green-600" style={{ background: "rgba(34,197,94,0.15)" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    Active Subscription — {subInfo.active.plan === "PRO" ? "Premium" : "Recruiter"}
                                </p>
                                <p className="text-xs text-green-600">
                                    Valid from {new Date(subInfo.active.startDate).toLocaleDateString()} to {new Date(subInfo.active.endDate).toLocaleDateString()}
                                    {" "}({Math.max(0, Math.ceil((new Date(subInfo.active.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {plans.map((plan) => {
                        const isCurrent = currentTier === plan.tier;
                        const hasPending = subInfo?.pending?.plan === plan.tier;
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
                                            {hasPending && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(250,204,21,0.15)", color: "#a16207" }}>
                                                    Pending
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
                                        disabled={isCurrent || !!hasPending || plan.tier === "GUEST"}
                                        onClick={() => handleUpgrade(plan)}
                                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                                            isCurrent || hasPending
                                                ? "bg-[var(--gray-100)] text-[var(--gray-400)] cursor-default"
                                                : plan.popular
                                                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-100"
                                                    : plan.tier === "GUEST"
                                                        ? "bg-[var(--gray-100)] text-[var(--gray-400)] cursor-default"
                                                        : "border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)] hover:scale-[1.02] active:scale-100"
                                        }`}
                                    >
                                        {isCurrent ? "Current Plan" : hasPending ? "Payment Under Review" : plan.tier === "GUEST" ? "Free Forever" : plan.cta}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* How It Works */}
                <div className="max-w-2xl mx-auto mb-16">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center mb-8">
                        How Payment Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-lg" style={{ background: "rgba(0,122,255,0.1)" }}>1</div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Send Payment</h3>
                            <p className="text-xs text-[var(--gray-500)]">Transfer via InstaPay to <span className="font-mono font-semibold">{INSTAPAY_NUMBER}</span></p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-lg" style={{ background: "rgba(0,122,255,0.1)" }}>2</div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Upload Screenshot</h3>
                            <p className="text-xs text-[var(--gray-500)]">Take a screenshot of the transfer and upload it here</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-lg" style={{ background: "rgba(0,122,255,0.1)" }}>3</div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Get Activated</h3>
                            <p className="text-xs text-[var(--gray-500)]">Admin reviews and activates your plan within hours</p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <FaqItem
                            q="How do I pay?"
                            a={`Send the plan amount via InstaPay to ${INSTAPAY_NUMBER}, take a screenshot of the successful transfer, then upload it on this page. Your subscription will be activated once confirmed.`}
                        />
                        <FaqItem
                            q="How long does activation take?"
                            a="Most subscriptions are activated within a few hours. You'll see your plan status update automatically once the admin confirms your payment."
                        />
                        <FaqItem
                            q="What happens when my subscription expires?"
                            a="Your account automatically switches back to the Free plan. You'll keep your analysis history, but future analyses will be limited to 5 per month."
                        />
                        <FaqItem
                            q="Can I renew my subscription?"
                            a="Yes! Simply send a new payment and upload the screenshot before your current subscription ends. The admin will extend your subscription dates."
                        />
                        <FaqItem
                            q="What does the Recruiter plan include?"
                            a="The Recruiter plan adds batch processing for up to 50 resumes at once, candidate ranking, CSV export, and 1,000 analyses per month."
                        />
                        <FaqItem
                            q="Do unused analyses roll over?"
                            a="No, analysis counts reset at the beginning of each billing cycle. Premium users enjoy unlimited analyses so this doesn't apply."
                        />
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

                        {/* Payment Instructions */}
                        <div className="p-4 rounded-xl bg-[var(--gray-100)] border border-[var(--gray-200)] mb-6">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                                Payment Instructions
                            </h3>
                            <ol className="space-y-3 text-sm text-[var(--gray-600)]">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-[var(--accent)]">1.</span>
                                    <span>Open your bank app or InstaPay</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-[var(--accent)]">2.</span>
                                    <span>
                                        Send <span className="font-bold text-[var(--foreground)]">{selectedPlan.price} EGP</span> to:
                                    </span>
                                </li>
                            </ol>
                            <div className="mt-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--gray-300)] text-center">
                                <p className="text-xs text-[var(--gray-500)] mb-1">InstaPay Number</p>
                                <p className="text-2xl font-mono font-bold text-[var(--foreground)] tracking-wider">
                                    {INSTAPAY_NUMBER}
                                </p>
                            </div>
                            <p className="mt-3 text-xs text-[var(--gray-500)]">
                                After sending, take a screenshot of the successful transfer confirmation.
                            </p>
                        </div>

                        {/* Screenshot Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Upload Payment Screenshot
                            </label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                className="w-full text-sm text-[var(--gray-500)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--gray-100)] file:text-[var(--accent)] hover:file:bg-[var(--gray-200)] cursor-pointer"
                            />
                            {screenshot && (
                                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg border border-green-300" style={{ background: "rgba(34,197,94,0.08)" }}>
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-xs text-green-700 truncate">{screenshot.name}</span>
                                    <span className="text-xs text-green-500">({(screenshot.size / 1024).toFixed(0)} KB)</span>
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`mb-4 p-3 rounded-xl text-sm border ${
                                message.type === "success"
                                    ? "text-green-700 border-green-300"
                                    : "text-red-700 border-red-300"
                            }`} style={{ background: message.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" }}>
                                {message.text}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmitPayment}
                            disabled={!screenshot || submitting}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                                !screenshot || submitting
                                    ? "bg-[var(--gray-200)] text-[var(--gray-400)] cursor-not-allowed"
                                    : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                            }`}
                        >
                            {submitting ? "Submitting..." : "Submit Payment Proof"}
                        </button>

                        <p className="mt-3 text-center text-xs text-[var(--gray-400)]">
                            Your subscription will be activated after admin confirmation
                        </p>
                    </div>
                </div>
            )}

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
