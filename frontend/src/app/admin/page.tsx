"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface AdminUser {
    id: number;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
    provider: string;
    emailVerified: boolean;
    userType: string | null;
    analysesThisMonth: number;
    subscriptionStatus: string;
    createdAt: string;
    _count: { resumes: number };
}

interface DashboardStats {
    totalUsers: number;
    tierBreakdown: { guest: number; pro: number; recruiter: number };
    totalResumes: number;
    totalAnalyses: number;
    recentUsers: number;
}

interface UserDetail extends AdminUser {
    providerId: string | null;
    githubId: string | null;
    googleId: string | null;
    onboardingComplete: boolean;
    subscriptionEndDate: string | null;
    analysesResetDate: string;
    updatedAt: string;
    resumes: Array<{
        id: number;
        fileName: string;
        fileSize: number;
        createdAt: string;
        _count: { analyses: number };
    }>;
}

export default function AdminDashboard() {
    const { user, loading: authLoading, logout, isAdmin } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
    const [search, setSearch] = useState("");
    const [filterTier, setFilterTier] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "CANDIDATE", tier: "GUEST" });
    const [activeTab, setActiveTab] = useState<"users" | "subscriptions">("users");
    const [subs, setSubs] = useState<any[]>([]);
    const [subStats, setSubStats] = useState<any>(null);
    const [subFilter, setSubFilter] = useState("");
    const [subLoading, setSubLoading] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [subDates, setSubDates] = useState({ startDate: "", endDate: "" });
    const [adminNote, setAdminNote] = useState("");

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin())) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router, isAdmin]);

    const getToken = () => localStorage.getItem("token");

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) setStats(await res.json());
        } catch { /* ignore */ }
    }, []);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pagination.limit),
                sortBy: "createdAt",
                sortOrder: "desc",
            });
            if (search) params.set("search", search);
            if (filterTier) params.set("tier", filterTier);
            if (filterRole) params.set("role", filterRole);

            const res = await fetch(`${API_URL}/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [search, filterTier, filterRole, pagination.limit]);

    useEffect(() => {
        if (user && isAdmin()) {
            fetchStats();
            fetchUsers();
        }
    }, [user, isAdmin, fetchStats, fetchUsers]);

    const openUserDetail = async (userId: number) => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                setSelectedUser(await res.json());
                setShowModal(true);
            }
        } catch { /* ignore */ }
    };

    const updateTier = async (userId: number, tier: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/tier`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ tier }),
            });
            if (res.ok) {
                showMessage("success", `Tier updated to ${tier}`);
                await fetchUsers(pagination.page);
                if (selectedUser) {
                    setSelectedUser({ ...selectedUser, tier });
                }
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to update tier");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const updateRole = async (userId: number, role: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (res.ok) {
                showMessage("success", `Role updated to ${role}`);
                await fetchUsers(pagination.page);
                if (selectedUser) {
                    setSelectedUser({ ...selectedUser, role });
                }
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to update role");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const resetUsage = async (userId: number) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/reset-usage`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                showMessage("success", "Usage reset successfully");
                await fetchUsers(pagination.page);
                if (selectedUser) {
                    setSelectedUser({ ...selectedUser, analysesThisMonth: 0 });
                }
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const deleteUser = async (userId: number) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                showMessage("success", "User deleted");
                setShowModal(false);
                setSelectedUser(null);
                await fetchUsers(pagination.page);
                await fetchStats();
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to delete user");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const createUser = async () => {
        if (!newUser.email || !newUser.password) {
            showMessage("error", "Email and password are required");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            if (res.ok) {
                showMessage("success", `User ${newUser.email} created`);
                setShowCreateModal(false);
                setNewUser({ email: "", password: "", name: "", role: "CANDIDATE", tier: "GUEST" });
                await fetchUsers(1);
                await fetchStats();
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to create user");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const fetchSubs = useCallback(async () => {
        setSubLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (subFilter) params.set("status", subFilter);
            const res = await fetch(`${API_URL}/admin/subscriptions?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSubs(data.subscriptions || []);
            }
        } catch { /* ignore */ } finally {
            setSubLoading(false);
        }
    }, [subFilter]);

    const fetchSubStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/subscriptions/stats`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) setSubStats(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (activeTab === "subscriptions" && user && isAdmin()) {
            fetchSubs();
            fetchSubStats();
        }
    }, [activeTab, user, isAdmin, fetchSubs, fetchSubStats]);

    const approveSub = async () => {
        if (!selectedSub || !subDates.startDate || !subDates.endDate) {
            showMessage("error", "Start and end dates are required");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/subscriptions/${selectedSub.id}/approve`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ startDate: subDates.startDate, endDate: subDates.endDate, adminNote }),
            });
            if (res.ok) {
                showMessage("success", "Subscription approved");
                setShowSubModal(false);
                setSelectedSub(null);
                await fetchSubs();
                await fetchSubStats();
                await fetchUsers(pagination.page);
                await fetchStats();
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to approve");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const rejectSub = async (subId: number) => {
        const note = prompt("Reason for rejection (optional):");
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/subscriptions/${subId}/reject`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ adminNote: note || "" }),
            });
            if (res.ok) {
                showMessage("success", "Subscription rejected");
                await fetchSubs();
                await fetchSubStats();
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to reject");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const updateSubDates = async (subId: number) => {
        if (!subDates.startDate || !subDates.endDate) {
            showMessage("error", "Both dates required");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/subscriptions/${subId}/dates`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ startDate: subDates.startDate, endDate: subDates.endDate }),
            });
            if (res.ok) {
                showMessage("success", "Dates updated");
                setShowSubModal(false);
                await fetchSubs();
            } else {
                const err = await res.json();
                showMessage("error", err.message || "Failed to update dates");
            }
        } catch { showMessage("error", "Network error"); } finally {
            setActionLoading(false);
        }
    };

    const openSubDetail = (sub: any) => {
        setSelectedSub(sub);
        setSubDates({
            startDate: sub.startDate ? new Date(sub.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            endDate: sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
        setAdminNote(sub.adminNote || "");
        setShowSubModal(true);
    };

    const tierBadge = (tier: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            GUEST: { bg: "rgba(142,142,147,0.15)", text: "var(--gray-500)" },
            PRO: { bg: "rgba(0,122,255,0.12)", text: "var(--accent)" },
            RECRUITER: { bg: "rgba(52,199,89,0.12)", text: "var(--success)" },
        };
        const c = colors[tier] || colors.GUEST;
        return (
            <span style={{ background: c.bg, color: c.text }} className="px-2 py-1 rounded-full text-xs font-medium">
                {tier === "GUEST" ? "Free" : tier === "PRO" ? "Premium" : tier}
            </span>
        );
    };

    const roleBadge = (role: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            CANDIDATE: { bg: "rgba(142,142,147,0.15)", text: "var(--gray-500)" },
            ADMIN: { bg: "rgba(255,59,48,0.12)", text: "var(--error)" },
            RECRUITER: { bg: "rgba(255,159,10,0.12)", text: "var(--warning)" },
        };
        const c = colors[role] || colors.CANDIDATE;
        return (
            <span style={{ background: c.bg, color: c.text }} className="px-2 py-1 rounded-full text-xs font-medium">
                {role}
            </span>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || !isAdmin()) return null;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                            Skillora
                        </Link>
                        <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(255,59,48,0.12)", color: "var(--error)" }}>
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={logout} className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors">
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Toast */}
            {message && (
                <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg" style={{
                    background: message.type === "success" ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.15)",
                    color: message.type === "success" ? "var(--success)" : "var(--error)",
                    border: `1px solid ${message.type === "success" ? "rgba(52,199,89,0.3)" : "rgba(255,59,48,0.3)"}`,
                }}>
                    {message.text}
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-3xl font-semibold text-[var(--foreground)] tracking-tight mb-8">
                    Admin Dashboard
                </h1>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <StatCard label="Total Users" value={stats.totalUsers} />
                        <StatCard label="Free Users" value={stats.tierBreakdown.guest} />
                        <StatCard label="Premium Users" value={stats.tierBreakdown.pro} color="var(--accent)" />
                        <StatCard label="Recruiters" value={stats.tierBreakdown.recruiter} color="var(--success)" />
                        <StatCard label="Total Resumes" value={stats.totalResumes} />
                        <StatCard label="Total Analyses" value={stats.totalAnalyses} />
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[var(--gray-100)] w-fit">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "users" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--gray-500)] hover:text-[var(--foreground)]"}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab("subscriptions")}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "subscriptions" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--gray-500)] hover:text-[var(--foreground)]"}`}
                    >
                        Subscriptions
                        {subStats?.pending > 0 && (
                            <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: "var(--error)" }}>
                                {subStats.pending}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === "users" && (<>
                {/* Create User Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create User
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="glass-card apple-shadow p-4 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by email or name..."
                                className="input-field w-full text-sm py-2"
                            />
                        </div>
                        <select
                            value={filterTier}
                            onChange={(e) => { setFilterTier(e.target.value); }}
                            className="input-field w-full sm:w-40"
                        >
                            <option value="">All Tiers</option>
                            <option value="GUEST">Free</option>
                            <option value="PRO">Premium</option>
                            <option value="RECRUITER">Recruiter</option>
                        </select>
                        <select
                            value={filterRole}
                            onChange={(e) => { setFilterRole(e.target.value); }}
                            className="input-field w-full sm:w-40"
                        >
                            <option value="">All Roles</option>
                            <option value="CANDIDATE">Candidate</option>
                            <option value="RECRUITER">Recruiter</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <button type="submit" className="btn-primary whitespace-nowrap">
                            Search
                        </button>
                    </form>
                </div>

                {/* Users Table */}
                <div className="glass-card apple-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--gray-200)]">
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-6 py-4">User</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Plan</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Role</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Provider</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Analyses</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Resumes</th>
                                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Joined</th>
                                    <th className="text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-[var(--gray-400)]">
                                        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-[var(--gray-400)]">No users found</td></tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} onClick={() => openUserDetail(u.id)} className="border-b border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0" style={{
                                                        background: u.image ? "transparent" : "linear-gradient(135deg, var(--accent), #0051a8)",
                                                        color: "white",
                                                    }}>
                                                        {u.image ? (
                                                            <img src={u.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (u.name?.charAt(0) || u.email.charAt(0)).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-[var(--foreground)] truncate">{u.name || "—"}</div>
                                                        <div className="text-xs text-[var(--gray-500)] truncate">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{tierBadge(u.tier)}</td>
                                            <td className="px-4 py-4">{roleBadge(u.role)}</td>
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-[var(--gray-500)]">{u.provider}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-[var(--foreground)]">{u.analysesThisMonth}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-[var(--foreground)]">{u._count.resumes}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-[var(--gray-500)]">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {u.role !== "ADMIN" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete user ${u.email}?`)) deleteUser(u.id); }}
                                                        className="text-[var(--error)] text-sm hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--gray-200)]">
                            <span className="text-sm text-[var(--gray-500)]">
                                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchUsers(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-[var(--gray-300)] text-[var(--foreground)] disabled:opacity-40 hover:bg-[var(--gray-100)] transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchUsers(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-[var(--gray-300)] text-[var(--foreground)] disabled:opacity-40 hover:bg-[var(--gray-100)] transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </>)}

                {/* Subscriptions Tab */}
                {activeTab === "subscriptions" && (
                    <>
                        {/* Subscription Stats */}
                        {subStats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                <StatCard label="Pending" value={subStats.pending} color="var(--warning)" />
                                <StatCard label="Approved" value={subStats.approved} color="var(--success)" />
                                <StatCard label="Rejected" value={subStats.rejected} color="var(--error)" />
                                <StatCard label="Expired" value={subStats.expired} />
                                <div className="glass-card apple-shadow p-5 rounded-xl">
                                    <div className="text-2xl font-semibold text-[var(--accent)]">
                                        {subStats.totalRevenue?.toLocaleString() || 0} <span className="text-sm font-normal text-[var(--gray-500)]">EGP</span>
                                    </div>
                                    <div className="text-xs text-[var(--gray-500)] mt-1">Total Revenue</div>
                                </div>
                            </div>
                        )}

                        {/* Sub Filters */}
                        <div className="glass-card apple-shadow p-4 mb-6">
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { value: "", label: "All" },
                                    { value: "PENDING", label: "Pending" },
                                    { value: "APPROVED", label: "Approved" },
                                    { value: "REJECTED", label: "Rejected" },
                                    { value: "EXPIRED", label: "Expired" },
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setSubFilter(f.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subFilter === f.value ? "bg-[var(--accent)] text-white" : "border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)]"}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subscriptions List */}
                        <div className="glass-card apple-shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--gray-200)]">
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-6 py-4">User</th>
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Plan</th>
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Amount</th>
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Status</th>
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Dates</th>
                                            <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-4">Submitted</th>
                                            <th className="text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subLoading ? (
                                            <tr><td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            </td></tr>
                                        ) : subs.length === 0 ? (
                                            <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--gray-400)]">No subscriptions found</td></tr>
                                        ) : subs.map((sub) => (
                                            <tr key={sub.id} className="border-b border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-[var(--foreground)]">{sub.user?.name || "—"}</div>
                                                    <div className="text-xs text-[var(--gray-500)]">{sub.user?.email}</div>
                                                </td>
                                                <td className="px-4 py-4">{tierBadge(sub.plan)}</td>
                                                <td className="px-4 py-4 text-sm text-[var(--foreground)]">{sub.amount} {sub.currency}</td>
                                                <td className="px-4 py-4">{subStatusBadge(sub.status)}</td>
                                                <td className="px-4 py-4 text-xs text-[var(--gray-500)]">
                                                    {sub.startDate && sub.endDate ? (
                                                        <>{new Date(sub.startDate).toLocaleDateString()} — {new Date(sub.endDate).toLocaleDateString()}</>
                                                    ) : "—"}
                                                </td>
                                                <td className="px-4 py-4 text-xs text-[var(--gray-500)]">
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openSubDetail(sub)}
                                                            className="text-[var(--accent)] text-xs font-medium hover:underline"
                                                        >
                                                            View
                                                        </button>
                                                        {sub.status === "PENDING" && (
                                                            <button
                                                                onClick={() => rejectSub(sub.id)}
                                                                className="text-[var(--error)] text-xs font-medium hover:underline"
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* User Detail Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <div className="glass-card apple-shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: "var(--background)" }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--gray-200)]">
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">User Profile</h2>
                            <button onClick={() => { setShowModal(false); setSelectedUser(null); }} className="text-[var(--gray-400)] hover:text-[var(--foreground)] transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold overflow-hidden" style={{
                                    background: selectedUser.image ? "transparent" : "linear-gradient(135deg, var(--accent), #0051a8)",
                                    color: "white",
                                }}>
                                    {selectedUser.image ? (
                                        <img src={selectedUser.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{selectedUser.name || "No name"}</h3>
                                    <p className="text-sm text-[var(--gray-500)]">{selectedUser.email}</p>
                                    <p className="text-xs text-[var(--gray-400)] mt-1">ID: {selectedUser.id} · Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Provider" value={selectedUser.provider} />
                                <InfoItem label="Email Verified" value={selectedUser.emailVerified ? "Yes" : "No"} />
                                <InfoItem label="User Type" value={selectedUser.userType || "—"} />
                                <InfoItem label="Onboarding" value={selectedUser.onboardingComplete ? "Complete" : "Pending"} />
                                <InfoItem label="Analyses This Month" value={String(selectedUser.analysesThisMonth)} />
                                <InfoItem label="Resumes Uploaded" value={String(selectedUser._count.resumes)} />
                                <InfoItem label="Subscription" value={selectedUser.subscriptionStatus} />
                                <InfoItem label="GitHub ID" value={selectedUser.githubId || (selectedUser.provider === "GITHUB" ? (selectedUser.providerId || "—") : "—")} />
                                <InfoItem label="Google ID" value={selectedUser.googleId || (selectedUser.provider === "GOOGLE" ? (selectedUser.providerId || "—") : "—")} />
                                <InfoItem label="Last Updated" value={new Date(selectedUser.updatedAt).toLocaleString()} />
                                <InfoItem label="Analyses Reset" value={new Date(selectedUser.analysesResetDate).toLocaleDateString()} />
                                <InfoItem label="Subscription Ends" value={selectedUser.subscriptionEndDate ? new Date(selectedUser.subscriptionEndDate).toLocaleDateString() : "—"} />
                            </div>

                            {/* Tier Control */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Plan / Tier</label>
                                <div className="flex gap-2">
                                    {["GUEST", "PRO", "RECRUITER"].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => updateTier(selectedUser.id, t)}
                                            disabled={actionLoading || selectedUser.tier === t}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedUser.tier === t
                                                ? (t === "RECRUITER" ? "bg-[var(--success)] text-white" : "bg-[var(--accent)] text-white")
                                                : "border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)]"
                                                } disabled:opacity-50`}
                                        >
                                            {t === "GUEST" ? "Free" : t === "PRO" ? "Premium" : "Recruiter"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role Control */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Role</label>
                                <div className="flex gap-2">
                                    {["CANDIDATE", "RECRUITER", "ADMIN"].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => updateRole(selectedUser.id, r)}
                                            disabled={actionLoading || selectedUser.role === r}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedUser.role === r
                                                ? (r === "ADMIN" ? "bg-[var(--error)] text-white" : r === "RECRUITER" ? "bg-[var(--success)] text-white" : "bg-[var(--accent)] text-white")
                                                : "border border-[var(--gray-300)] text-[var(--foreground)] hover:bg-[var(--gray-100)]"
                                                } disabled:opacity-50`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resumes */}
                            {selectedUser.resumes.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Recent Resumes</h4>
                                    <div className="space-y-2">
                                        {selectedUser.resumes.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--gray-100)]">
                                                <div>
                                                    <span className="text-sm text-[var(--foreground)]">{r.fileName}</span>
                                                    <span className="text-xs text-[var(--gray-400)] ml-2">{(r.fileSize / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <span className="text-xs text-[var(--gray-500)]">{r._count.analyses} analyses</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Danger Zone */}
                            <div className="pt-4 border-t border-[var(--gray-200)] space-y-3">
                                <button
                                    onClick={() => resetUsage(selectedUser.id)}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--warning)] text-[var(--warning)] hover:bg-[rgba(255,159,10,0.1)] transition-colors disabled:opacity-50"
                                >
                                    Reset Monthly Usage
                                </button>
                                {selectedUser.role !== "ADMIN" && (
                                    <button
                                        onClick={() => deleteUser(selectedUser.id)}
                                        disabled={actionLoading}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--error)] text-[var(--error)] hover:bg-[rgba(255,59,48,0.1)] transition-colors disabled:opacity-50"
                                    >
                                        Delete User
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <div className="glass-card apple-shadow w-full max-w-md rounded-2xl" style={{ background: "var(--background)" }}>
                        <div className="flex items-center justify-between p-6 border-b border-[var(--gray-200)]">
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create New User</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--gray-400)] hover:text-[var(--foreground)] transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="input-field w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                    className="input-field w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Full name"
                                    className="input-field w-full text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Plan</label>
                                    <select
                                        value={newUser.tier}
                                        onChange={(e) => setNewUser({ ...newUser, tier: e.target.value })}
                                        className="input-field w-full text-sm"
                                    >
                                        <option value="GUEST">Free</option>
                                        <option value="PRO">Premium</option>
                                        <option value="RECRUITER">Recruiter</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="input-field w-full text-sm"
                                    >
                                        <option value="CANDIDATE">Candidate</option>
                                        <option value="RECRUITER">Recruiter</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={createUser}
                                disabled={actionLoading}
                                className="btn-primary w-full mt-2 disabled:opacity-50"
                            >
                                {actionLoading ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Subscription Detail Modal */}
            {showSubModal && selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <div className="glass-card apple-shadow w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: "var(--background)" }}>
                        <div className="flex items-center justify-between p-6 border-b border-[var(--gray-200)]">
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Subscription Details</h2>
                            <button onClick={() => { setShowSubModal(false); setSelectedSub(null); }} className="text-[var(--gray-400)] hover:text-[var(--foreground)] transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* User Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{
                                    background: "linear-gradient(135deg, var(--accent), #0051a8)", color: "white"
                                }}>
                                    {(selectedSub.user?.name?.charAt(0) || selectedSub.user?.email?.charAt(0) || "?").toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[var(--foreground)]">{selectedSub.user?.name || "—"}</div>
                                    <div className="text-xs text-[var(--gray-500)]">{selectedSub.user?.email}</div>
                                </div>
                                <div className="ml-auto">{subStatusBadge(selectedSub.status)}</div>
                            </div>

                            {/* Subscription Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <InfoItem label="Plan" value={selectedSub.plan === "PRO" ? "Premium" : "Recruiter"} />
                                <InfoItem label="Amount" value={`${selectedSub.amount} ${selectedSub.currency}`} />
                                <InfoItem label="Payment Method" value={selectedSub.paymentMethod || "InstaPay"} />
                                <InfoItem label="Submitted" value={new Date(selectedSub.createdAt).toLocaleString()} />
                            </div>

                            {/* Screenshot */}
                            {selectedSub.screenshotPath && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Payment Screenshot</label>
                                    <div className="rounded-xl overflow-hidden border border-[var(--gray-200)]">
                                        <img
                                            src={`${API_URL}/admin/subscriptions/screenshot/${selectedSub.screenshotPath.split("/").pop()}`}
                                            alt="Payment screenshot"
                                            className="w-full max-h-[300px] object-contain bg-[var(--gray-100)]"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="p-8 text-center text-sm" style="color: var(--gray-400)">Screenshot could not be loaded</div>';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Date Pickers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={subDates.startDate}
                                        onChange={(e) => setSubDates({ ...subDates, startDate: e.target.value })}
                                        className="input-field w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={subDates.endDate}
                                        onChange={(e) => setSubDates({ ...subDates, endDate: e.target.value })}
                                        className="input-field w-full text-sm"
                                    />
                                </div>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--gray-500)] mb-1">Admin Note</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Optional note..."
                                    rows={2}
                                    className="input-field w-full text-sm resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 pt-2">
                                {selectedSub.status === "PENDING" && (
                                    <button
                                        onClick={approveSub}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                                        style={{ background: "var(--success)" }}
                                    >
                                        {actionLoading ? "Processing..." : "Approve & Activate"}
                                    </button>
                                )}
                                {selectedSub.status === "PENDING" && (
                                    <button
                                        onClick={() => rejectSub(selectedSub.id)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[var(--error)] text-[var(--error)] hover:bg-[rgba(255,59,48,0.1)] transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                )}
                                {selectedSub.status === "APPROVED" && (
                                    <button
                                        onClick={() => updateSubDates(selectedSub.id)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                                        style={{ background: "var(--accent)" }}
                                    >
                                        {actionLoading ? "Updating..." : "Update Dates"}
                                    </button>
                                )}
                            </div>

                            {/* Existing Admin Note */}
                            {selectedSub.adminNote && selectedSub.status !== "PENDING" && (
                                <div className="p-3 rounded-lg bg-[var(--gray-100)]">
                                    <div className="text-xs text-[var(--gray-500)]">Admin Note</div>
                                    <div className="text-sm text-[var(--foreground)] mt-0.5">{selectedSub.adminNote}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function subStatusBadge(status: string) {
    const colors: Record<string, { bg: string; text: string }> = {
        PENDING: { bg: "rgba(255,159,10,0.12)", text: "#c27803" },
        APPROVED: { bg: "rgba(52,199,89,0.12)", text: "#15803d" },
        REJECTED: { bg: "rgba(255,59,48,0.12)", text: "#dc2626" },
        EXPIRED: { bg: "rgba(142,142,147,0.15)", text: "#6b7280" },
    };
    const c = colors[status] || colors.PENDING;
    return (
        <span style={{ background: c.bg, color: c.text }} className="px-2 py-1 rounded-full text-xs font-medium">
            {status}
        </span>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div className="glass-card apple-shadow p-5 rounded-xl">
            <div className="text-2xl font-semibold" style={{ color: color || "var(--foreground)" }}>
                {value.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--gray-500)] mt-1">{label}</div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg bg-[var(--gray-100)]">
            <div className="text-xs text-[var(--gray-500)]">{label}</div>
            <div className="text-sm font-medium text-[var(--foreground)] mt-0.5">{value}</div>
        </div>
    );
}
