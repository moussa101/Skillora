"use client";

import { useState, useCallback } from "react";

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
            setResult(null);  // Clear previous result for new comparison
            // Note: jobDescription is preserved for easy comparison of different resumes
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
            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", file);
            formData.append("job_description", jobDescription);

            // Use analyze-file endpoint that handles PDF/DOCX extraction server-side
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


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        AI Resume Analyzer
                    </h1>
                    <p className="text-purple-200">
                        Analyze your resume against job descriptions with ML-powered insights
                    </p>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            📄 Upload Resume
                        </h2>

                        {/* File Upload */}
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${file ? "border-green-400 bg-green-400/10" : "border-white/30 hover:border-purple-400"}`}
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
                                <div className="text-green-400">
                                    <span className="text-2xl">✓</span>
                                    <p className="mt-2 font-medium">{file.name}</p>
                                    <p className="text-sm text-green-300">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-white/60">
                                    <span className="text-4xl">📁</span>
                                    <p className="mt-2">Drop your resume here or click to browse</p>
                                    <p className="text-sm text-white/40">PDF, DOCX, or TXT (max 5MB)</p>
                                </div>
                            )}
                        </div>

                        {/* Job Description */}
                        <div className="mt-6">
                            <label className="block text-white/80 mb-2 font-medium">
                                💼 Job Description
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                className="w-full h-40 bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all
                ${loading
                                    ? "bg-purple-400/50 text-white/50 cursor-wait"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30"
                                }`}
                        >
                            {loading ? "🔄 Analyzing..." : "🚀 Analyze Resume"}
                        </button>
                    </div>

                    {/* Results Section */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            📊 Analysis Results
                        </h2>

                        {result ? (
                            <div className="space-y-6">
                                {/* Score */}
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 
                    ${result.score >= 80 ? "border-green-400" : result.score >= 60 ? "border-yellow-400" : "border-red-400"}`}>
                                        <span className="text-4xl font-bold text-white">{result.score}%</span>
                                    </div>
                                    {result.suspicious && (
                                        <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
                                            ⚠️ {result.suspiciousReason || "Flagged for review"}
                                        </div>
                                    )}
                                </div>

                                {/* Security Status */}
                                {result.security && (
                                    <div className={`p-3 rounded-lg ${result.security.isSafe ? "bg-green-500/20" : "bg-red-500/20"}`}>
                                        <span className={result.security.isSafe ? "text-green-400" : "text-red-400"}>
                                            {result.security.isSafe ? "✓ Security Check Passed" : "⚠️ Security Issues Detected"}
                                        </span>
                                    </div>
                                )}

                                {/* Skills */}
                                <div>
                                    <h3 className="text-white/80 font-medium mb-2">✅ Skills Found</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.skillsFound.map((skill) => (
                                            <span key={skill} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Missing Keywords */}
                                <div>
                                    <h3 className="text-white/80 font-medium mb-2">❌ Missing Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingKeywords.map((keyword) => (
                                            <span key={keyword} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                {result.feedback && (
                                    <div>
                                        <h3 className="text-white/80 font-medium mb-2">💡 Suggestions</h3>
                                        <ul className="space-y-2">
                                            {result.feedback.suggestions.map((suggestion, i) => (
                                                <li key={i} className="text-white/70 flex items-start gap-2">
                                                    <span className="text-purple-400">→</span>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-white/40">
                                <div className="text-center">
                                    <span className="text-6xl">📋</span>
                                    <p className="mt-4">Upload a resume and click analyze to see results</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
