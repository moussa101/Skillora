"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface GitHubProfile {
    username: string;
    name?: string;
    bio?: string;
    company?: string;
    location?: string;
    public_repos: number;
    followers: number;
    total_stars: number;
    top_languages: string[];
    recent_commits: number;
    notable_repos: Array<{
        name: string;
        description: string;
        stars: number;
        language?: string;
        url: string;
    }>;
}

interface ProfileAnalysis {
    github?: GitHubProfile;
    linkedin_url?: string;
    profile_score: number;
    profile_insights: string[];
    urls_found: Record<string, string | string[] | null>;
}

interface AnalysisResult {
    score: number;
    suspicious: boolean;
    suspiciousReason?: string;
    security?: {
        isSafe: boolean;
        flags: string[];
        invisibleTextDetected: boolean;
    };
    skillsFound: string[];
    missingKeywords: string[];
    feedback?: {
        summary: string;
        suggestions: string[];
    };
    profileAnalysis?: ProfileAnalysis;
}

export default function Dashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    }, []);

    const handleAnalyze = async () => {
        if (!file || !jobDescription.trim()) {
            setError("Please upload a resume and enter a job description");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("job_description", jobDescription);

            const mlResponse = await fetch("http://localhost:8000/analyze-file", {
                method: "POST",
                body: formData,
            });

            if (!mlResponse.ok) {
                const errorData = await mlResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || `Analysis failed: ${mlResponse.statusText}`);
            }

            const data = await mlResponse.json();

            setResult({
                score: data.score,
                suspicious: data.suspicious || false,
                suspiciousReason: data.suspicious_reason,
                security: data.security ? {
                    isSafe: data.security.is_safe,
                    flags: data.security.flags || [],
                    invisibleTextDetected: data.security.invisible_text_detected || false,
                } : undefined,
                skillsFound: data.skills_found || [],
                missingKeywords: data.missing_keywords || [],
                feedback: data.feedback,
                profileAnalysis: data.profile_analysis ? {
                    github: data.profile_analysis.github,
                    linkedin_url: data.profile_analysis.linkedin_url,
                    profile_score: data.profile_analysis.profile_score,
                    profile_insights: data.profile_analysis.profile_insights || [],
                    urls_found: data.profile_analysis.urls_found || {}
                } : undefined,
            });
        } catch (err) {
            console.error("Analysis error:", err);
            setError(err instanceof Error ? err.message : "Analysis failed. Make sure the ML service is running.");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--success)";
        if (score >= 60) return "var(--warning)";
        return "var(--error)";
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = result
        ? circumference - (result.score / 100) * circumference
        : circumference;

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

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                        Skillora
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-[var(--gray-500)] text-sm">
                            {user.email}
                        </span>
                        <button
                            onClick={logout}
                            className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-3xl font-semibold text-[var(--foreground)] tracking-tight">
                        Resume Analysis
                    </h1>
                    <p className="mt-2 text-[var(--gray-500)]">
                        Upload your resume and paste a job description to get started
                    </p>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="glass-card apple-shadow p-8">
                        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                            Upload Resume
                        </h2>

                        {/* File Upload */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover-lift
                                ${file
                                    ? "border-[var(--success)] bg-[rgba(52,199,89,0.05)]"
                                    : "border-[var(--gray-300)] hover:border-[var(--accent)]"
                                }`}
                            onClick={() => document.getElementById("file-input")?.click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {file ? (
                                <div className="text-[var(--success)]">
                                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="font-medium text-[var(--foreground)]">{file.name}</p>
                                    <p className="text-sm text-[var(--gray-500)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-[var(--gray-500)]">
                                    <svg className="w-10 h-10 mx-auto mb-3 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-medium">Drop your resume here</p>
                                    <p className="text-sm text-[var(--gray-400)] mt-1">PDF, DOCX, or TXT (max 5MB)</p>
                                </div>
                            )}
                        </div>

                        {/* Job Description */}
                        <div className="mt-6">
                            <label className="block text-[var(--foreground)] mb-2 font-medium text-sm">
                                Job Description
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                className="input-field w-full h-40 resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-4 bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] rounded-xl text-[var(--error)] text-sm">
                                {error}
                            </div>
                        )}

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                "Analyze Resume"
                            )}
                        </button>
                    </div>

                    {/* Results Section */}
                    <div className="glass-card apple-shadow p-8">
                        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                            Analysis Results
                        </h2>

                        {result ? (
                            <div className="space-y-8">
                                {/* Score Circle */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="45"
                                                stroke="var(--gray-200)"
                                                strokeWidth="8"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="45"
                                                stroke={getScoreColor(result.score)}
                                                strokeWidth="8"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl font-semibold text-[var(--foreground)]">
                                                {result.score}%
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-[var(--gray-500)]">Match Score</p>

                                    {result.suspicious && (
                                        <div className="mt-3 px-4 py-2 bg-[rgba(255,159,10,0.1)] border border-[rgba(255,159,10,0.2)] rounded-lg text-[var(--warning)] text-sm">
                                            Score above 95% may indicate copy-paste
                                        </div>
                                    )}
                                </div>

                                {/* Security Status */}
                                {result.security && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${result.security.isSafe
                                        ? "bg-[rgba(52,199,89,0.1)]"
                                        : "bg-[rgba(255,59,48,0.1)]"
                                        }`}>
                                        {result.security.isSafe ? (
                                            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        )}
                                        <span className={result.security.isSafe ? "text-[var(--success)]" : "text-[var(--error)]"}>
                                            {result.security.isSafe ? "Security Check Passed" : "Security Issues Detected"}
                                        </span>
                                    </div>
                                )}

                                {/* Skills Found */}
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Skills Found</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.skillsFound.length > 0 ? (
                                            result.skillsFound.map((skill) => (
                                                <span key={skill} className="tag tag-success">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--gray-400)] text-sm">No skills detected</span>
                                        )}
                                    </div>
                                </div>

                                {/* Missing Keywords */}
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Missing Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingKeywords.length > 0 ? (
                                            result.missingKeywords.map((keyword) => (
                                                <span key={keyword} className="tag tag-error">
                                                    {keyword}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--gray-400)] text-sm">No missing keywords</span>
                                        )}
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {result.feedback && result.feedback.suggestions.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Suggestions</h3>
                                        <ul className="space-y-2">
                                            {result.feedback.suggestions.map((suggestion, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-[var(--gray-500)]">
                                                    <svg className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* GitHub Profile Analysis */}
                                {result.profileAnalysis && (result.profileAnalysis.github || result.profileAnalysis.linkedin_url) && (
                                    <div className="card-glass p-4 rounded-xl">
                                        <h3 className="text-sm font-medium text-[var(--foreground)] mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                            </svg>
                                            Profile Analysis
                                            {result.profileAnalysis.profile_score > 0 && (
                                                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[var(--accent)] text-white">
                                                    {Math.round(result.profileAnalysis.profile_score)}% Profile Score
                                                </span>
                                            )}
                                        </h3>

                                        {result.profileAnalysis.github && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={`https://github.com/${result.profileAnalysis.github.username}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[var(--accent)] hover:underline text-sm font-medium"
                                                    >
                                                        @{result.profileAnalysis.github.username}
                                                    </a>
                                                    {result.profileAnalysis.github.name && (
                                                        <span className="text-[var(--gray-500)] text-sm">
                                                            ({result.profileAnalysis.github.name})
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <div className="text-center p-2 bg-[var(--gray-100)] rounded-lg">
                                                        <div className="text-lg font-semibold text-[var(--foreground)]">
                                                            {result.profileAnalysis.github.public_repos}
                                                        </div>
                                                        <div className="text-xs text-[var(--gray-500)]">Repos</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-[var(--gray-100)] rounded-lg">
                                                        <div className="text-lg font-semibold text-[var(--foreground)]">
                                                            {result.profileAnalysis.github.total_stars}
                                                        </div>
                                                        <div className="text-xs text-[var(--gray-500)]">Stars</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-[var(--gray-100)] rounded-lg">
                                                        <div className="text-lg font-semibold text-[var(--foreground)]">
                                                            {result.profileAnalysis.github.followers}
                                                        </div>
                                                        <div className="text-xs text-[var(--gray-500)]">Followers</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-[var(--gray-100)] rounded-lg">
                                                        <div className="text-lg font-semibold text-[var(--foreground)]">
                                                            {result.profileAnalysis.github.recent_commits}
                                                        </div>
                                                        <div className="text-xs text-[var(--gray-500)]">Recent Commits</div>
                                                    </div>
                                                </div>

                                                {result.profileAnalysis.github.top_languages.length > 0 && (
                                                    <div>
                                                        <span className="text-xs text-[var(--gray-500)]">Top Languages: </span>
                                                        <span className="text-sm text-[var(--foreground)]">
                                                            {result.profileAnalysis.github.top_languages.join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {result.profileAnalysis.profile_insights.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[var(--gray-200)]">
                                                <div className="flex flex-wrap gap-2">
                                                    {result.profileAnalysis.profile_insights.map((insight, i) => (
                                                        <span key={i} className="text-xs px-2 py-1 bg-[var(--gray-100)] rounded-full text-[var(--gray-600)]">
                                                            {insight}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {result.profileAnalysis.linkedin_url && (
                                            <div className="mt-3 pt-3 border-t border-[var(--gray-200)]">
                                                <a
                                                    href={result.profileAnalysis.linkedin_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                    </svg>
                                                    View LinkedIn Profile
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-[var(--gray-400)]">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm">Upload a resume to see analysis results</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
