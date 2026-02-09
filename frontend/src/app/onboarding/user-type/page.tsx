'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const userTypes = [
    {
        id: 'STUDENT',
        title: 'Student',
        description: 'Looking to improve my resume for internships or first jobs',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
        ),
        gradient: 'from-blue-500 to-cyan-400',
    },
    {
        id: 'PROFESSIONAL',
        title: 'Professional',
        description: 'Planning a career change or actively searching for new opportunities',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        gradient: 'from-purple-500 to-pink-400',
    },
    {
        id: 'RECRUITER',
        title: 'Recruiter',
        description: 'Reviewing candidate resumes and looking for top talent',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        gradient: 'from-orange-500 to-amber-400',
    },
];

export default function UserTypePage() {
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleContinue = () => {
        if (!selected) return;
        setLoading(true);
        // Store selection and navigate to plan selection
        sessionStorage.setItem('onboarding_userType', selected);
        router.push('/onboarding/select-plan');
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Navigation */}
            <nav className="w-full py-4 px-6 flex justify-between items-center">
                <Link href="/" className="text-[var(--foreground)] font-semibold text-xl tracking-tight">
                    Skillora
                </Link>
                <span className="text-sm text-[var(--gray-400)]">Step 1 of 2</span>
            </nav>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
                            What best describes you?
                        </h1>
                        <p className="text-[var(--gray-500)] text-lg">
                            This helps us personalize your experience
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {userTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelected(type.id)}
                                className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left flex items-center gap-5 group ${selected === type.id
                                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg'
                                        : 'border-[var(--gray-200)] hover:border-[var(--gray-300)] hover:bg-[var(--gray-100)]/50'
                                    }`}
                            >
                                <div
                                    className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 ${selected === type.id
                                            ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg`
                                            : 'bg-[var(--gray-100)] text-[var(--gray-500)] group-hover:bg-[var(--gray-200)]'
                                        }`}
                                >
                                    {type.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                                        {type.title}
                                    </h3>
                                    <p className="text-[var(--gray-500)] text-sm">
                                        {type.description}
                                    </p>
                                </div>
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selected === type.id
                                            ? 'border-[var(--accent)] bg-[var(--accent)]'
                                            : 'border-[var(--gray-300)]'
                                        }`}
                                >
                                    {selected === type.id && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!selected || loading}
                        className="w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Continue
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
