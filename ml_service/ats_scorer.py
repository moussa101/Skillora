"""
ATS (Applicant Tracking System) Compatibility Scorer

Evaluates how well a resume will parse and rank in common ATS systems
by checking formatting, structure, keyword optimization, and best practices.

Scoring categories:
  1. Formatting & Parsability (25%)  - Can the ATS read it correctly?
  2. Section Detection (20%)        - Are standard sections present?
  3. Keyword Optimization (25%)     - Are JD keywords used effectively?
  4. Contact Information (10%)      - Is contact info complete and parsable?
  5. Content Quality (20%)          - Action verbs, metrics, length
"""

import re
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass, field


# ============================================
# CONSTANTS
# ============================================

# Standard resume section headers that ATS systems look for
STANDARD_SECTIONS = {
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "work history", "career history",
        "relevant experience", "professional background",
    ],
    "education": [
        "education", "academic background", "academic qualifications",
        "educational background", "qualifications", "degrees",
    ],
    "skills": [
        "skills", "technical skills", "core competencies",
        "key skills", "competencies", "areas of expertise",
        "proficiencies", "technologies",
    ],
    "summary": [
        "summary", "professional summary", "career summary",
        "profile", "professional profile", "about me",
        "objective", "career objective",
    ],
    "certifications": [
        "certifications", "certificates", "licenses",
        "professional certifications", "credentials",
    ],
    "projects": [
        "projects", "key projects", "personal projects",
        "notable projects", "portfolio",
    ],
}

# Action verbs that ATS and recruiters look for
ACTION_VERBS = {
    "achieved", "administered", "analyzed", "built", "collaborated",
    "conducted", "coordinated", "created", "delivered", "designed",
    "developed", "directed", "drove", "engineered", "established",
    "executed", "expanded", "facilitated", "generated", "grew",
    "identified", "implemented", "improved", "increased", "initiated",
    "integrated", "launched", "led", "managed", "mentored",
    "monitored", "negotiated", "optimized", "orchestrated", "organized",
    "oversaw", "pioneered", "planned", "produced", "reduced",
    "redesigned", "refactored", "resolved", "revamped", "scaled",
    "shipped", "spearheaded", "streamlined", "supervised", "transformed",
    "upgraded", "utilized",
}

# Characters/patterns that confuse ATS parsers
ATS_PROBLEMATIC_PATTERNS = [
    (r'[│|┃┆┇┊┋]', "table/pipe characters"),
    (r'[★☆●◆◇▪▫►▸•]', "decorative bullet symbols"),
    (r'[─━═┄┅┈┉]', "box-drawing line characters"),
    (r'[\u200b\u200c\u200d\ufeff]', "zero-width/invisible characters"),
    (r'[©®™]', "special symbols (©, ®, ™)"),
]

# Common date formats ATS can parse
DATE_PATTERNS = [
    r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b',
    r'\b\d{1,2}/\d{4}\b',
    r'\b\d{4}\s*[-–—]\s*(?:\d{4}|[Pp]resent|[Cc]urrent)\b',
    r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|[Pp]resent|[Cc]urrent)\b',
]

# Metrics/quantification patterns
METRICS_PATTERN = r'\b\d+[%+xX]?\b|\$\d+|\d+\s*(?:users|clients|customers|projects|team|members|engineers|developers|people|employees|reports|applications|servers|endpoints|requests|transactions|records)'


@dataclass
class ATSCheckResult:
    """Result of a single ATS check"""
    name: str
    passed: bool
    score: float  # 0.0 - 1.0
    message: str
    severity: str = "info"  # "critical", "warning", "info", "good"


@dataclass
class ATSCategory:
    """Scoring for one ATS category"""
    name: str
    score: float  # 0 - 100
    weight: float
    checks: List[ATSCheckResult] = field(default_factory=list)
    tips: List[str] = field(default_factory=list)


@dataclass
class ATSScore:
    """Complete ATS compatibility score"""
    overall_score: float  # 0 - 100
    categories: List[ATSCategory] = field(default_factory=list)
    critical_issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    keyword_match_rate: float = 0.0  # 0 - 100


class ATSScorer:
    """
    Evaluates resume text for ATS compatibility.
    """

    def score(self, resume_text: str, job_description: str,
              skills_found: List[str], missing_keywords: List[str]) -> ATSScore:
        """
        Calculate comprehensive ATS compatibility score.

        Args:
            resume_text: Extracted resume text
            job_description: Target job description
            skills_found: Skills already extracted by the analyzer
            missing_keywords: Missing keywords already identified

        Returns:
            ATSScore with detailed breakdown
        """
        categories = [
            self._score_formatting(resume_text),
            self._score_sections(resume_text),
            self._score_keywords(resume_text, job_description, skills_found, missing_keywords),
            self._score_contact(resume_text),
            self._score_content(resume_text),
        ]

        # Weighted average
        total_weight = sum(c.weight for c in categories)
        overall = sum(c.score * c.weight for c in categories) / total_weight if total_weight else 0

        # Collect critical issues and suggestions
        critical = []
        suggestions = []
        for cat in categories:
            for check in cat.checks:
                if check.severity == "critical" and not check.passed:
                    critical.append(check.message)
            suggestions.extend(cat.tips)

        # Calculate keyword match rate
        total_kw = len(skills_found) + len(missing_keywords)
        kw_rate = (len(skills_found) / total_kw * 100) if total_kw > 0 else 0

        return ATSScore(
            overall_score=round(min(100, max(0, overall)), 1),
            categories=categories,
            critical_issues=critical[:5],
            suggestions=suggestions[:6],
            keyword_match_rate=round(kw_rate, 1),
        )

    # ------------------------------------------
    # Category 1: Formatting & Parsability (25%)
    # ------------------------------------------
    def _score_formatting(self, text: str) -> ATSCategory:
        checks: List[ATSCheckResult] = []
        tips: List[str] = []
        score = 100.0

        # Check for problematic characters
        problematic_found = []
        for pattern, label in ATS_PROBLEMATIC_PATTERNS:
            if re.search(pattern, text):
                problematic_found.append(label)

        if problematic_found:
            deduction = min(len(problematic_found) * 10, 30)
            score -= deduction
            checks.append(ATSCheckResult(
                name="special_characters",
                passed=False,
                score=max(0, 1 - deduction / 30),
                message=f"Found ATS-unfriendly characters: {', '.join(problematic_found)}",
                severity="warning",
            ))
            tips.append("Remove decorative symbols and special characters — ATS may misparse them")
        else:
            checks.append(ATSCheckResult(
                name="special_characters",
                passed=True,
                score=1.0,
                message="No problematic special characters detected",
                severity="good",
            ))

        # Check for excessive blank lines (formatting issues)
        blank_runs = re.findall(r'\n{4,}', text)
        if len(blank_runs) > 2:
            score -= 10
            checks.append(ATSCheckResult(
                name="blank_lines",
                passed=False,
                score=0.5,
                message="Excessive blank lines detected — may indicate formatting issues",
                severity="info",
            ))
            tips.append("Remove excessive blank lines to improve ATS parsing")
        else:
            checks.append(ATSCheckResult(
                name="blank_lines",
                passed=True,
                score=1.0,
                message="Spacing looks clean",
                severity="good",
            ))

        # Check resume length (too short or too long)
        word_count = len(text.split())
        if word_count < 100:
            score -= 25
            checks.append(ATSCheckResult(
                name="length",
                passed=False,
                score=0.2,
                message=f"Resume is very short ({word_count} words) — ATS may rank it low",
                severity="critical",
            ))
            tips.append("Add more detail — aim for 400-800 words for a strong resume")
        elif word_count < 250:
            score -= 10
            checks.append(ATSCheckResult(
                name="length",
                passed=False,
                score=0.6,
                message=f"Resume is short ({word_count} words) — consider adding more detail",
                severity="warning",
            ))
            tips.append("Expand your experience and skills sections for better ATS ranking")
        elif word_count > 1500:
            score -= 5
            checks.append(ATSCheckResult(
                name="length",
                passed=True,
                score=0.8,
                message=f"Resume is long ({word_count} words) — consider trimming to 1-2 pages",
                severity="info",
            ))
        else:
            checks.append(ATSCheckResult(
                name="length",
                passed=True,
                score=1.0,
                message=f"Good resume length ({word_count} words)",
                severity="good",
            ))

        # Check for header/footer-like repeated text (can confuse ATS)
        lines = text.strip().split('\n')
        if len(lines) > 5:
            first_line = lines[0].strip().lower()
            if any(first_line == l.strip().lower() for l in lines[-3:]) and len(first_line) > 5:
                score -= 5
                checks.append(ATSCheckResult(
                    name="header_footer",
                    passed=False,
                    score=0.7,
                    message="Repeated header/footer text detected — ATS may double-count it",
                    severity="info",
                ))

        return ATSCategory(
            name="Formatting & Parsability",
            score=max(0, score),
            weight=0.25,
            checks=checks,
            tips=tips,
        )

    # ------------------------------------------
    # Category 2: Section Detection (20%)
    # ------------------------------------------
    def _score_sections(self, text: str) -> ATSCategory:
        checks: List[ATSCheckResult] = []
        tips: List[str] = []
        text_lower = text.lower()

        found_sections = {}
        for section_key, headers in STANDARD_SECTIONS.items():
            found = False
            for header in headers:
                # Look for header on its own line or followed by colon/newline
                pattern = r'(?:^|\n)\s*' + re.escape(header) + r'\s*[:\n]'
                if re.search(pattern, text_lower):
                    found = True
                    break
            found_sections[section_key] = found

        # Required sections
        required = ["experience", "education", "skills"]
        required_found = sum(1 for s in required if found_sections.get(s, False))

        if required_found == len(required):
            score = 80.0
            checks.append(ATSCheckResult(
                name="required_sections",
                passed=True,
                score=1.0,
                message="All key sections found (Experience, Education, Skills)",
                severity="good",
            ))
        else:
            missing = [s.title() for s in required if not found_sections.get(s, False)]
            score = max(20, (required_found / len(required)) * 80)
            checks.append(ATSCheckResult(
                name="required_sections",
                passed=False,
                score=required_found / len(required),
                message=f"Missing key sections: {', '.join(missing)}",
                severity="critical",
            ))
            tips.append(f"Add clear section headers for: {', '.join(missing)}")

        # Bonus sections
        bonus = ["summary", "certifications", "projects"]
        bonus_found = sum(1 for s in bonus if found_sections.get(s, False))
        bonus_score = bonus_found * (20 / len(bonus))
        score += bonus_score

        if bonus_found > 0:
            found_names = [s.title() for s in bonus if found_sections.get(s, False)]
            checks.append(ATSCheckResult(
                name="bonus_sections",
                passed=True,
                score=bonus_found / len(bonus),
                message=f"Bonus sections found: {', '.join(found_names)}",
                severity="good",
            ))
        else:
            checks.append(ATSCheckResult(
                name="bonus_sections",
                passed=False,
                score=0.0,
                message="No summary, certifications, or projects section found",
                severity="info",
            ))
            tips.append("Add a Professional Summary section at the top for better ATS ranking")

        return ATSCategory(
            name="Section Structure",
            score=min(100, max(0, score)),
            weight=0.20,
            checks=checks,
            tips=tips,
        )

    # ------------------------------------------
    # Category 3: Keyword Optimization (25%)
    # ------------------------------------------
    def _score_keywords(self, text: str, jd: str,
                        skills_found: List[str], missing: List[str]) -> ATSCategory:
        checks: List[ATSCheckResult] = []
        tips: List[str] = []

        total = len(skills_found) + len(missing)
        if total == 0:
            return ATSCategory(
                name="Keyword Optimization",
                score=50.0,
                weight=0.25,
                checks=[ATSCheckResult(
                    name="keyword_match",
                    passed=True,
                    score=0.5,
                    message="No specific skills detected in job description",
                    severity="info",
                )],
                tips=["Include relevant technical skills explicitly in your resume"],
            )

        match_rate = len(skills_found) / total
        score = match_rate * 100

        # Keyword match check
        if match_rate >= 0.8:
            checks.append(ATSCheckResult(
                name="keyword_match",
                passed=True,
                score=match_rate,
                message=f"Excellent keyword match: {len(skills_found)}/{total} skills ({match_rate:.0%})",
                severity="good",
            ))
        elif match_rate >= 0.5:
            checks.append(ATSCheckResult(
                name="keyword_match",
                passed=True,
                score=match_rate,
                message=f"Good keyword match: {len(skills_found)}/{total} skills ({match_rate:.0%})",
                severity="info",
            ))
            tips.append(f"Add missing keywords to improve ATS ranking: {', '.join(missing[:3])}")
        else:
            checks.append(ATSCheckResult(
                name="keyword_match",
                passed=False,
                score=match_rate,
                message=f"Low keyword match: {len(skills_found)}/{total} skills ({match_rate:.0%})",
                severity="critical",
            ))
            tips.append(f"Your resume is missing critical keywords: {', '.join(missing[:4])}")

        # Check if skills appear in a dedicated skills section
        text_lower = text.lower()
        skills_section = False
        for header in STANDARD_SECTIONS["skills"]:
            if header in text_lower:
                skills_section = True
                break

        if skills_section:
            # Check how many matched skills are clustered in the skills section
            checks.append(ATSCheckResult(
                name="skills_section",
                passed=True,
                score=1.0,
                message="Skills listed in a dedicated section — ATS-friendly",
                severity="good",
            ))
            score = min(100, score + 5)
        else:
            checks.append(ATSCheckResult(
                name="skills_section",
                passed=False,
                score=0.3,
                message="No dedicated skills section found — ATS may miss your skills",
                severity="warning",
            ))
            tips.append("Create a 'Skills' or 'Technical Skills' section listing your key skills")
            score = max(0, score - 5)

        # Check for keyword stuffing (same skill mentioned too many times)
        for skill in skills_found[:5]:
            count = len(re.findall(re.escape(skill.lower()), text_lower))
            if count > 8:
                score -= 10
                checks.append(ATSCheckResult(
                    name="keyword_stuffing",
                    passed=False,
                    score=0.3,
                    message=f"'{skill}' appears {count} times — may be flagged as keyword stuffing",
                    severity="warning",
                ))
                tips.append("Avoid repeating the same keyword excessively — use it 2-4 times naturally")
                break

        return ATSCategory(
            name="Keyword Optimization",
            score=max(0, min(100, score)),
            weight=0.25,
            checks=checks,
            tips=tips,
        )

    # ------------------------------------------
    # Category 4: Contact Information (10%)
    # ------------------------------------------
    def _score_contact(self, text: str) -> ATSCategory:
        checks: List[ATSCheckResult] = []
        tips: List[str] = []
        score = 0.0

        # Email
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', text)
        if email_match:
            score += 30
            checks.append(ATSCheckResult(
                name="email",
                passed=True,
                score=1.0,
                message=f"Email found: {email_match.group()[:30]}",
                severity="good",
            ))
        else:
            checks.append(ATSCheckResult(
                name="email",
                passed=False,
                score=0.0,
                message="No email address found",
                severity="critical",
            ))
            tips.append("Add your email address — it's essential for ATS parsing")

        # Phone
        phone_match = re.search(r'[\+]?[\d\s\-\(\)]{7,15}', text[:500])
        if phone_match:
            score += 25
            checks.append(ATSCheckResult(
                name="phone",
                passed=True,
                score=1.0,
                message="Phone number found",
                severity="good",
            ))
        else:
            checks.append(ATSCheckResult(
                name="phone",
                passed=False,
                score=0.0,
                message="No phone number detected",
                severity="warning",
            ))
            tips.append("Add a phone number for recruiter contact")

        # LinkedIn
        linkedin = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
        if linkedin:
            score += 20
            checks.append(ATSCheckResult(
                name="linkedin",
                passed=True,
                score=1.0,
                message="LinkedIn profile URL found",
                severity="good",
            ))
        else:
            checks.append(ATSCheckResult(
                name="linkedin",
                passed=False,
                score=0.0,
                message="No LinkedIn profile URL found",
                severity="info",
            ))
            tips.append("Include your LinkedIn profile URL")

        # Name (heuristic: first non-empty line that's short and has no special chars)
        lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
        name_found = False
        if lines:
            first_line = lines[0]
            if 2 <= len(first_line.split()) <= 5 and not re.search(r'[@\d]', first_line):
                name_found = True
                score += 25
                checks.append(ATSCheckResult(
                    name="name",
                    passed=True,
                    score=1.0,
                    message=f"Name likely detected: {first_line[:40]}",
                    severity="good",
                ))

        if not name_found:
            checks.append(ATSCheckResult(
                name="name",
                passed=False,
                score=0.0,
                message="Name may not be clearly placed at the top",
                severity="warning",
            ))
            tips.append("Put your full name as the first line of your resume")

        return ATSCategory(
            name="Contact Information",
            score=min(100, max(0, score)),
            weight=0.10,
            checks=checks,
            tips=tips,
        )

    # ------------------------------------------
    # Category 5: Content Quality (20%)
    # ------------------------------------------
    def _score_content(self, text: str) -> ATSCategory:
        checks: List[ATSCheckResult] = []
        tips: List[str] = []
        score = 0.0
        text_lower = text.lower()
        words = text_lower.split()

        # Action verbs
        found_verbs = set()
        for verb in ACTION_VERBS:
            if re.search(r'\b' + re.escape(verb) + r'\b', text_lower):
                found_verbs.add(verb)

        verb_ratio = len(found_verbs)
        if verb_ratio >= 8:
            score += 35
            checks.append(ATSCheckResult(
                name="action_verbs",
                passed=True,
                score=1.0,
                message=f"Strong use of action verbs ({len(found_verbs)} found)",
                severity="good",
            ))
        elif verb_ratio >= 4:
            score += 25
            checks.append(ATSCheckResult(
                name="action_verbs",
                passed=True,
                score=0.7,
                message=f"Good use of action verbs ({len(found_verbs)} found)",
                severity="info",
            ))
            tips.append("Use more action verbs like 'implemented', 'optimized', 'delivered'")
        else:
            score += 10
            checks.append(ATSCheckResult(
                name="action_verbs",
                passed=False,
                score=0.3,
                message=f"Few action verbs found ({len(found_verbs)}) — resume may seem passive",
                severity="warning",
            ))
            tips.append("Start bullet points with action verbs: 'Built', 'Led', 'Reduced', 'Designed'")

        # Quantified achievements (numbers, percentages, dollar amounts)
        metrics_matches = re.findall(METRICS_PATTERN, text)
        if len(metrics_matches) >= 5:
            score += 35
            checks.append(ATSCheckResult(
                name="metrics",
                passed=True,
                score=1.0,
                message=f"Good use of metrics and numbers ({len(metrics_matches)} found)",
                severity="good",
            ))
        elif len(metrics_matches) >= 2:
            score += 20
            checks.append(ATSCheckResult(
                name="metrics",
                passed=True,
                score=0.6,
                message=f"Some metrics found ({len(metrics_matches)}) — add more for impact",
                severity="info",
            ))
            tips.append("Quantify achievements: 'Increased performance by 40%', 'Managed team of 8'")
        else:
            score += 5
            checks.append(ATSCheckResult(
                name="metrics",
                passed=False,
                score=0.2,
                message="Very few quantified achievements found",
                severity="warning",
            ))
            tips.append("Add numbers to your achievements: revenue, percentages, team sizes, etc.")

        # Dates/chronology
        dates = []
        for pattern in DATE_PATTERNS:
            dates.extend(re.findall(pattern, text))

        if len(dates) >= 2:
            score += 30
            checks.append(ATSCheckResult(
                name="dates",
                passed=True,
                score=1.0,
                message=f"Clear date entries found ({len(dates)} dates)",
                severity="good",
            ))
        elif len(dates) == 1:
            score += 15
            checks.append(ATSCheckResult(
                name="dates",
                passed=True,
                score=0.5,
                message="Only one date entry found — add dates to all positions",
                severity="info",
            ))
            tips.append("Add start and end dates (e.g., 'Jan 2022 – Present') to all positions")
        else:
            checks.append(ATSCheckResult(
                name="dates",
                passed=False,
                score=0.0,
                message="No date entries detected — ATS needs dates for chronological parsing",
                severity="critical",
            ))
            tips.append("Include dates for each role: 'Jan 2022 – Present' or '2021 – 2023'")

        return ATSCategory(
            name="Content Quality",
            score=min(100, max(0, score)),
            weight=0.20,
            checks=checks,
            tips=tips,
        )


def score_ats(resume_text: str, job_description: str,
              skills_found: List[str], missing_keywords: List[str]) -> Dict:
    """
    Main entry point — returns ATS score as a serializable dict.
    """
    scorer = ATSScorer()
    result = scorer.score(resume_text, job_description, skills_found, missing_keywords)

    return {
        "overall_score": result.overall_score,
        "keyword_match_rate": result.keyword_match_rate,
        "critical_issues": result.critical_issues,
        "suggestions": result.suggestions,
        "categories": [
            {
                "name": cat.name,
                "score": round(cat.score, 1),
                "checks": [
                    {
                        "name": c.name,
                        "passed": c.passed,
                        "message": c.message,
                        "severity": c.severity,
                    }
                    for c in cat.checks
                ],
            }
            for cat in result.categories
        ],
    }
