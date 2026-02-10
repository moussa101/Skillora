"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// Multilingual "Hello" greetings
const greetings = [
  { text: "Hello", language: "English" },
  { text: "Hola", language: "Spanish" },
  { text: "Bonjour", language: "French" },
  { text: "Hallo", language: "German" },
  { text: "Ciao", language: "Italian" },
  { text: "Olá", language: "Portuguese" },
  { text: "Привет", language: "Russian" },
  { text: "مرحبا", language: "Arabic" },
  { text: "你好", language: "Chinese" },
  { text: "こんにちは", language: "Japanese" },
  { text: "안녕하세요", language: "Korean" },
  { text: "नमस्ते", language: "Hindi" },
];

function AnimatedGreeting() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % greetings.length);
        setIsVisible(true);
      }, 500);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-28 sm:h-36 md:h-48 flex items-center justify-center py-4">
      <span
        className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text text-transparent transition-all duration-500 ease-out leading-tight ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
      >
        {greetings[currentIndex].text}
      </span>
    </div>
  );
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Navigation */}
      <nav className="w-full py-4 px-6 flex justify-between items-center">
        <div className="text-[var(--foreground)] font-semibold text-xl tracking-tight">
          Skillora
        </div>
        {loading ? (
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        ) : user ? (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors max-w-[160px]"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    background: user.image ? "transparent" : "linear-gradient(135deg, var(--accent), #0051a8)",
                    color: "white",
                  }}
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate">{user.name || user.email}</span>
              </Link>
              <Link
                href={user.role === 'ADMIN' ? '/admin' : user.role === 'RECRUITER' || user.tier === 'RECRUITER' ? '/recruiter' : '/dashboard'}
                className="text-[var(--foreground)] text-sm font-medium hover:text-[var(--accent)] transition-colors"
              >
                {user.role === 'ADMIN' ? 'Admin Panel' : user.role === 'RECRUITER' || user.tier === 'RECRUITER' ? 'Recruiter Panel' : 'Dashboard'}
              </Link>
              <Link
                href="/plans"
                className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
              >
                Plans
              </Link>
              <button
                onClick={logout}
                className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(true)} className="hamburger-btn md:hidden">
              <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Mobile menu overlay */}
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
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    background: user.image ? "transparent" : "linear-gradient(135deg, var(--accent), #0051a8)",
                    color: "white",
                  }}
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate">{user.name || user.email}</span>
              </Link>
              <div className="mobile-menu-divider" />
              <Link
                href={user.role === 'ADMIN' ? '/admin' : user.role === 'RECRUITER' || user.tier === 'RECRUITER' ? '/recruiter' : '/dashboard'}
                onClick={() => setMenuOpen(false)}
                className="mobile-menu-link"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                {user.role === 'ADMIN' ? 'Admin Panel' : user.role === 'RECRUITER' || user.tier === 'RECRUITER' ? 'Recruiter Panel' : 'Dashboard'}
              </Link>
              <Link href="/plans" onClick={() => setMenuOpen(false)} className="mobile-menu-link">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                </svg>
                Plans
              </Link>
              <div className="mobile-menu-divider" />
              <button onClick={() => { logout(); setMenuOpen(false); }} className="mobile-menu-link danger">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/plans"
              className="text-[var(--gray-500)] text-sm hover:text-[var(--foreground)] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-[var(--foreground)] text-sm font-medium hover:text-[var(--accent)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-hover)] transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated Greetings */}
        <AnimatedGreeting />

        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--foreground)] tracking-tight max-w-2xl leading-tight mt-4">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text text-transparent">
            Skillora
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[var(--gray-500)] max-w-xl leading-relaxed">
          Your AI-powered resume analyzer. Get intelligent feedback on how your
          skills match job descriptions, powered by machine learning.
        </p>

        {/* Features Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
          <div className="card-glass p-5 rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Smart Analysis</h3>
            <p className="text-xs text-[var(--gray-500)] leading-relaxed">NLP-powered matching between resume and job descriptions</p>
          </div>

          <div className="card-glass p-5 rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--success)] flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Skill Detection</h3>
            <p className="text-xs text-[var(--gray-500)] leading-relaxed">Extract and match technical skills from your resume</p>
          </div>

          <div className="card-glass p-5 rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#5856d6] flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Profile Insights</h3>
            <p className="text-xs text-[var(--gray-500)] leading-relaxed">Analyze GitHub and LinkedIn for deeper insights</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white text-base font-medium rounded-full hover:bg-[var(--accent-hover)] transition-all hover:scale-105 active:scale-100"
        >
          Start Analyzing
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[var(--gray-400)] text-sm">
        <p>Skillora - AI-Powered Resume Analysis</p>
      </footer>
    </div>
  );
}
