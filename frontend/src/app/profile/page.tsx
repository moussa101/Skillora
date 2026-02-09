"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const TIER_CONFIG = {
    GUEST: {
        name: "Free",
        color: "var(--gray-500)",
        bgColor: "rgba(142, 142, 147, 0.1)",
        borderColor: "rgba(142, 142, 147, 0.2)",
        icon: "free",
        limit: 5,
        features: ["5 analyses per month", "Basic skill matching", "PDF export"],
    },
    PRO: {
        name: "Premium",
        color: "var(--accent)",
        bgColor: "rgba(0, 122, 255, 0.1)",
        borderColor: "rgba(0, 122, 255, 0.2)",
        icon: "star",
        limit: -1,
        features: ["Unlimited analyses", "Advanced AI insights", "GitHub/LinkedIn analysis", "Priority support"],
    },
    RECRUITER: {
        name: "Organization",
        color: "var(--success)",
        bgColor: "rgba(52, 199, 89, 0.1)",
        borderColor: "rgba(52, 199, 89, 0.2)",
        icon: "building",
        limit: -1,
        features: ["Unlimited analyses", "Team collaboration", "API access", "Custom branding", "Dedicated support"],
    },
};

export default function ProfilePage() {
    const { user, loading: authLoading, logout, refreshUser, isAdmin } = useAuth();
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect to login if not authenticated, admin to admin dashboard
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if (isAdmin()) {
                router.push("/admin");
            }
        }
    }, [user, authLoading, router, isAdmin]);

    const getTierConfig = (tier: string) => {
        return TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.GUEST;
    };

    const getUsagePercentage = () => {
        if (!user) return 0;
        const limit = user.analysesLimit || getTierConfig(user.tier).limit;
        if (limit === -1) return 0; // unlimited
        return Math.min((user.analysesThisMonth / limit) * 100, 100);
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return email?.charAt(0).toUpperCase() || "U";
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload image');
            }

            // Refresh user data to get the new image
            await refreshUser();
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Show loading spinner while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    const tierConfig = getTierConfig(user.tier);
    const usagePercentage = getUsagePercentage();
    const limit = user.analysesLimit || tierConfig.limit;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                        Skillora
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
                        >
                            Dashboard
                        </Link>
                        {isAdmin() && (
                            <Link
                                href="/admin"
                                className="text-[var(--error)] text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                Admin
                            </Link>
                        )}
                        <button
                            onClick={logout}
                            className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Profile Header */}
                <div className="glass-card apple-shadow p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Profile Picture */}
                        <div className="relative group">
                            <div
                                className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-semibold overflow-hidden"
                                style={{
                                    background: user.image ? "transparent" : `linear-gradient(135deg, var(--accent), var(--accent-dark, #0051a8))`,
                                    color: "white",
                                }}
                            >
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name || "Profile"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    getInitials(user.name, user.email)
                                )}
                            </div>
                            {/* Upload overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* User Info */}
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                                {user.name || "User"}
                            </h1>
                            <p className="text-[var(--gray-500)] mt-1">{user.email}</p>

                            {/* Tier Badge */}
                            <div
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium"
                                style={{
                                    backgroundColor: tierConfig.bgColor,
                                    border: `1px solid ${tierConfig.borderColor}`,
                                    color: tierConfig.color,
                                }}
                            >
                                {tierConfig.icon === "free" && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {tierConfig.icon === "star" && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                )}
                                {tierConfig.icon === "building" && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                )}
                                <span>{tierConfig.name} Plan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Stats */}
                <div className="glass-card apple-shadow p-8 mb-8">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                        Usage This Month
                    </h2>

                    <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[var(--gray-500)]">Analyses Used</span>
                                <span className="font-medium text-[var(--foreground)]">
                                    {limit === -1 ? `${user.analysesThisMonth} / Unlimited` : `${user.analysesThisMonth} / ${limit}`}
                                </span>
                            </div>
                            <div className="h-3 bg-[var(--gray-200)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${usagePercentage}%`,
                                        backgroundColor: usagePercentage >= 90
                                            ? "var(--error)"
                                            : usagePercentage >= 70
                                                ? "var(--warning)"
                                                : "var(--accent)",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center p-4 bg-[var(--gray-100)] rounded-xl">
                                <div className="text-2xl font-semibold text-[var(--foreground)]">
                                    {user.analysesThisMonth}
                                </div>
                                <div className="text-xs text-[var(--gray-500)] mt-1">Used</div>
                            </div>
                            <div className="text-center p-4 bg-[var(--gray-100)] rounded-xl">
                                <div className="text-2xl font-semibold text-[var(--foreground)]">
                                    {limit === -1 ? "∞" : Math.max(0, limit - user.analysesThisMonth)}
                                </div>
                                <div className="text-xs text-[var(--gray-500)] mt-1">Remaining</div>
                            </div>
                            <div className="text-center p-4 bg-[var(--gray-100)] rounded-xl">
                                <div className="text-2xl font-semibold text-[var(--foreground)]">
                                    {limit === -1 ? "∞" : limit}
                                </div>
                                <div className="text-xs text-[var(--gray-500)] mt-1">Monthly Limit</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Features */}
                <div className="glass-card apple-shadow p-8 mb-8">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                        Your Plan Features
                    </h2>

                    <ul className="space-y-3">
                        {tierConfig.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-[var(--gray-600)]">
                                <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {user.tier === "GUEST" && (
                        <div className="mt-6 pt-6 border-t border-[var(--gray-200)]">
                            <p className="text-sm text-[var(--gray-500)] mb-4">
                                Upgrade to unlock more features and analyses
                            </p>
                            <button className="btn-primary">
                                Upgrade to Premium
                            </button>
                        </div>
                    )}
                </div>

                {/* Account Actions */}
                <div className="glass-card apple-shadow p-8">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                        Account Settings
                    </h2>

                    <div className="space-y-4">
                        <Link
                            href="/reset-password"
                            className="flex items-center justify-between p-4 rounded-xl bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <span className="text-[var(--foreground)]">Change Password</span>
                            </div>
                            <svg className="w-5 h-5 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(255,59,48,0.1)] hover:bg-[rgba(255,59,48,0.15)] transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-[var(--error)]">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
