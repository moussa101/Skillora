import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-6xl">🤖</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-4">
          AI Resume Analyzer
        </h1>

        <p className="text-xl text-purple-200 mb-8 max-w-xl mx-auto">
          Score your resume against job descriptions with ML-powered analysis.
          Get actionable feedback to improve your chances.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-green-400">✓</span> NLP-Powered Analysis
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-green-400">✓</span> Security Scanning
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-green-400">✓</span> Keyword Gap Detection
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          🚀 Analyze Your Resume
        </Link>

        {/* Footer */}
        <p className="mt-12 text-white/40 text-sm">
          Powered by spaCy, Sentence-Transformers, and NestJS
        </p>
      </div>
    </div>
  );
}
