import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Navigation */}
      <nav className="w-full py-4 px-6 flex justify-between items-center">
        <div className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
          Resume Analyzer
        </div>
        <Link
          href="/dashboard"
          className="text-[var(--accent)] text-sm font-medium hover:underline"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold text-[var(--foreground)] tracking-tight max-w-3xl leading-tight">
          Analyze your resume with
          <span className="bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text text-transparent">
            {" "}machine learning
          </span>
        </h1>

        <p className="mt-6 text-xl text-[var(--gray-500)] max-w-2xl leading-relaxed">
          Get intelligent feedback on how well your resume matches job descriptions.
          Powered by NLP and semantic analysis.
        </p>

        {/* Features */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-[var(--gray-500)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>NLP-Powered Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Skill Matching</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Keyword Gap Detection</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-12 inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white text-lg font-medium rounded-full hover:bg-[var(--accent-hover)] transition-all hover:scale-105 active:scale-100"
        >
          Analyze Your Resume
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Subtle tech stack */}
        <p className="mt-16 text-[var(--gray-400)] text-sm">
          Built with spaCy, Sentence-Transformers, and NestJS
        </p>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[var(--gray-400)] text-sm">
        <p>© 2024 Resume Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}
