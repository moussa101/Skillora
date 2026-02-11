"use client";

import { useState, useCallback, useRef } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface CandidateResult {
    id: string;
    fileName: string;
    score: number;
    skillsFound: string[];
    missingKeywords: string[];
    atsScore?: number;
    feedback?: string;
    analyzedAt: Date;
}

export default function RecruiterDashboard() {
    const { user, loading: authLoading, logout, refreshUser } = useAuth();
    const router = useRouter();

    const [jobDescription, setJobDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [candidates, setCandidates] = useState<CandidateResult[]>([]);
    const [sortBy, setSortBy] = useState<"score" | "atsScore" | "name">("score");
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if (user.role !== "RECRUITER" && user.tier !== "RECRUITER") {
                router.push("/dashboard");
            }
        }
    }, [user, authLoading, router]);

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            f => f.type === "application/pdf" || f.name.endsWith(".pdf") || f.name.endsWith(".docx") || f.name.endsWith(".txt")
        );
        setFiles(prev => [...prev, ...droppedFiles]);
        setError(null);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);
            setError(null);
        }
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const analyzeAll = async () => {
        if (files.length === 0 || !jobDescription.trim()) {
            setError("Please add resumes and enter a job description");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setProgress({ current: 0, total: files.length });
        const results: CandidateResult[] = [];

        for (let i = 0; i < files.length; i++) {
            setProgress({ current: i + 1, total: files.length });
            try {
                const formData = new FormData();
                formData.append("file", files[i]);
                formData.append("job_description", jobDescription);

                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/resumes/analyze-file`, {
                    method: "POST",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    results.push({
                        id: `${Date.now()}-${i}`,
                        fileName: files[i].name,
                        score: data.score,
                        skillsFound: data.skills_found || [],
                        missingKeywords: data.missing_keywords || [],
                        atsScore: data.ats_score?.overall_score,
                        feedback: data.feedback,
                        analyzedAt: new Date(),
                    });
                } else {
                    results.push({
                        id: `${Date.now()}-${i}`,
                        fileName: files[i].name,
                        score: 0,
                        skillsFound: [],
                        missingKeywords: [],
                        feedback: "Analysis failed",
                        analyzedAt: new Date(),
                    });
                }
            } catch {
                results.push({
                    id: `${Date.now()}-${i}`,
                    fileName: files[i].name,
                    score: 0,
                    skillsFound: [],
                    missingKeywords: [],
                    feedback: "Network error",
                    analyzedAt: new Date(),
                });
            }
        }

        setCandidates(prev => [...results, ...prev]);
        setFiles([]);
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh user data to update quota display
        if (refreshUser) refreshUser();
    };

    const sortedCandidates = [...candidates].sort((a, b) => {
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "atsScore") return (b.atsScore || 0) - (a.atsScore || 0);
        return a.fileName.localeCompare(b.fileName);
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--success)";
        if (score >= 60) return "var(--warning)";
        return "var(--error)";
    };

    const getRank = (score: number) => {
        if (score >= 80) return { label: "Strong Match", color: "var(--success)", bg: "rgba(52,199,89,0.12)" };
        if (score >= 60) return { label: "Good Match", color: "var(--warning)", bg: "rgba(255,159,10,0.12)" };
        if (score >= 40) return { label: "Partial Match", color: "var(--accent)", bg: "rgba(0,122,255,0.12)" };
        return { label: "Weak Match", color: "var(--error)", bg: "rgba(255,59,48,0.12)" };
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                            Skillora
                        </Link>
                        <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ background: "rgba(52,199,89,0.12)", color: "var(--success)" }}>
                            Recruiter
                        </span>
                    </div>
                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/profile" className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors">
                            Profile
                        </Link>
                        <button onClick={logout} className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors">
                            Sign out
                        </button>
                    </div>
                    {/* Mobile hamburger */}
                    <button onClick={() => setMenuOpen(true)} className="hamburger-btn md:hidden">
                        <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <div className={`mobile-menu-overlay ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(false)} />
            <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
                <div className="flex justify-between items-center mb-6">
                    <span className="font-semibold text-lg text-[var(--foreground)]">Menu</span>
                    <button onClick={() => setMenuOpen(false)} className="hamburger-btn">
                        <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="mobile-menu-link">
                    <svg className="w-5 h-5 flex-shrink-0 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    Profile
                </Link>
                <div className="mobile-menu-divider" />
                <button onClick={() => { logout(); setMenuOpen(false); }} className="mobile-menu-link danger">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    Sign out
                </button>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <p className="text-sm text-[var(--gray-500)] mb-1">Welcome back,</p>
                <h1 className="text-2xl md:text-3xl font-semibold text-[var(--foreground)] tracking-tight mb-2">
                    {user.name || user.email.split("@")[0]}
                </h1>
                <p className="text-sm md:text-base text-[var(--gray-500)] mb-8">
                    Upload multiple resumes and rank candidates against a job description
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Job Description */}
                    <div className="lg:col-span-1">
                        <div className="glass-card apple-shadow p-6 sticky top-6">
                            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Job Description</h2>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                className="input-field w-full min-h-[200px] text-sm resize-y"
                            />

                            {/* File Upload */}
                            <h2 className="text-sm font-semibold text-[var(--foreground)] mt-6 mb-3">
                                Resumes ({files.length})
                            </h2>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[var(--gray-300)] rounded-xl p-4 text-center cursor-pointer hover:border-[var(--accent)] transition-colors"
                            >
                                <svg className="w-6 h-6 mx-auto mb-2 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-xs text-[var(--gray-500)]">
                                    Drop resumes or click to browse
                                </p>
                                <p className="text-xs text-[var(--gray-400)] mt-1">PDF, DOCX, TXT</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* File list */}
                            {files.length > 0 && (
                                <div className="mt-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--gray-100)] text-xs">
                                            <span className="text-[var(--foreground)] truncate flex-1 mr-2">{f.name}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-[var(--error)] hover:underline flex-shrink-0">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <p className="text-xs text-[var(--error)] mt-3">{error}</p>
                            )}

                            <button
                                onClick={analyzeAll}
                                disabled={analyzing || files.length === 0 || !jobDescription.trim()}
                                className="btn-primary w-full mt-4 disabled:opacity-50"
                            >
                                {analyzing
                                    ? `Analyzing ${progress.current}/${progress.total}...`
                                    : `Analyze ${files.length} Resume${files.length !== 1 ? "s" : ""}`
                                }
                            </button>

                            {analyzing && (
                                <div className="mt-3">
                                    <div className="w-full h-2 rounded-full bg-[var(--gray-200)] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-2">
                        {candidates.length > 0 ? (
                            <>
                                {/* Controls */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                                        Candidates ({candidates.length})
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--gray-500)]">Sort by:</span>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="input-field text-xs py-1 px-2"
                                        >
                                            <option value="score">Match Score</option>
                                            <option value="atsScore">ATS Score</option>
                                            <option value="name">Name</option>
                                        </select>
                                        <button
                                            onClick={() => setCandidates([])}
                                            className="text-xs text-[var(--error)] hover:underline ml-2"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Candidate Cards */}
                                <div className="space-y-3">
                                    {sortedCandidates.map((c, index) => {
                                        const rank = getRank(c.score);
                                        return (
                                            <CandidateCard
                                                key={c.id}
                                                candidate={c}
                                                rank={index + 1}
                                                rankInfo={rank}
                                                getScoreColor={getScoreColor}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="glass-card apple-shadow p-12 text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                                    No candidates yet
                                </h3>
                                <p className="text-sm text-[var(--gray-500)] max-w-md mx-auto">
                                    Upload resumes and enter a job description to start screening candidates.
                                    Results will be ranked by match score.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function CandidateCard({
    candidate,
    rank,
    rankInfo,
    getScoreColor,
}: {
    candidate: CandidateResult;
    rank: number;
    rankInfo: { label: string; color: string; bg: string };
    getScoreColor: (score: number) => string;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="glass-card apple-shadow rounded-xl overflow-hidden">
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--gray-100)] transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{
                    background: rank <= 3 ? rankInfo.bg : "var(--gray-100)",
                    color: rank <= 3 ? rankInfo.color : "var(--gray-500)",
                }}>
                    {rank}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">
                        {candidate.fileName.replace(/\.(pdf|docx|txt)$/i, "")}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: rankInfo.bg, color: rankInfo.color }}>
                            {rankInfo.label}
                        </span>
                        <span className="text-xs text-[var(--gray-400)]">
                            {candidate.skillsFound.length} skills matched
                        </span>
                    </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                        <div className="text-xs text-[var(--gray-500)]">Match</div>
                        <div className="text-lg font-bold" style={{ color: getScoreColor(candidate.score) }}>
                            {candidate.score}%
                        </div>
                    </div>
                    {candidate.atsScore !== undefined && (
                        <div className="text-right">
                            <div className="text-xs text-[var(--gray-500)]">ATS</div>
                            <div className="text-lg font-bold" style={{ color: getScoreColor(candidate.atsScore) }}>
                                {candidate.atsScore}%
                            </div>
                        </div>
                    )}
                    <svg
                        className={`w-4 h-4 text-[var(--gray-400)] transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--gray-200)] space-y-3">
                    {/* Skills */}
                    {candidate.skillsFound.length > 0 && (
                        <div className="mt-3">
                            <div className="text-xs font-medium text-[var(--gray-500)] mb-1.5">Skills Found</div>
                            <div className="flex flex-wrap gap-1.5">
                                {candidate.skillsFound.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[rgba(52,199,89,0.1)] text-[var(--success)]">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing */}
                    {candidate.missingKeywords.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-[var(--gray-500)] mb-1.5">Missing Keywords</div>
                            <div className="flex flex-wrap gap-1.5">
                                {candidate.missingKeywords.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[rgba(255,59,48,0.1)] text-[var(--error)]">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {candidate.feedback && (
                        <div>
                            <div className="text-xs font-medium text-[var(--gray-500)] mb-1.5">AI Feedback</div>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line bg-[var(--gray-100)] p-3 rounded-lg">
                                {candidate.feedback}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
