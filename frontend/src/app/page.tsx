"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="h-24 flex items-center justify-center overflow-hidden">
      <span
        className={`text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text text-transparent transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
      >
        {greetings[currentIndex].text}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Navigation */}
      <nav className="w-full py-4 px-6 flex justify-between items-center">
        <div className="text-[var(--foreground)] font-semibold text-xl tracking-tight">
          Skillora
        </div>
        <div className="flex items-center gap-4">
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
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated Greetings */}
        <AnimatedGreeting />

        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--foreground)] tracking-tight max-w-3xl leading-tight mt-4">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text text-transparent">
            Skillora
          </span>
        </h1>

        <p className="mt-6 text-xl text-[var(--gray-500)] max-w-2xl leading-relaxed">
          Your AI-powered resume analyzer. Get intelligent feedback on how your
          skills match job descriptions, powered by machine learning.
        </p>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          <div className="card-glass p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Smart Analysis</h3>
            <p className="text-sm text-[var(--gray-500)]">NLP-powered matching between your resume and job descriptions</p>
          </div>

          <div className="card-glass p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--success)] flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Skill Detection</h3>
            <p className="text-sm text-[var(--gray-500)]">Automatically extract and match technical skills from your resume</p>
          </div>

          <div className="card-glass p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#5856d6] flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Profile Insights</h3>
            <p className="text-sm text-[var(--gray-500)]">Analyze GitHub and LinkedIn profiles for deeper candidate insights</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-12 inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white text-lg font-medium rounded-full hover:bg-[var(--accent-hover)] transition-all hover:scale-105 active:scale-100"
        >
          Start Analyzing
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
