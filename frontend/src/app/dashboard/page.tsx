"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

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
}

export default function Dashboard() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 border-b border-[var(--gray-200)]">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
                        Resume Analyzer
                    </Link>
                    <span className="text-[var(--gray-400)] text-sm">Dashboard</span>
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
