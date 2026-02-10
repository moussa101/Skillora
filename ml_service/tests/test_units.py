"""
Unit tests for ML service modules — analyzer, ATS scorer, language detection, profile analysis, security
"""

import pytest
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ==============================================
# Language Detector Unit Tests
# ==============================================

class TestLanguageDetector:
    """Tests for language_detector.py"""

    def test_detect_english(self):
        from language_detector import detect_language
        code, confidence, name = detect_language(
            "I am a software engineer with extensive experience in Python and JavaScript development."
        )
        assert code == "en"
        assert confidence > 0.5
        assert name == "English"

    def test_detect_spanish(self):
        from language_detector import detect_language
        code, confidence, name = detect_language(
            "Soy un ingeniero de software con amplia experiencia en desarrollo de aplicaciones web y móviles."
        )
        assert code == "es"
        assert confidence > 0.5

    def test_detect_french(self):
        from language_detector import detect_language
        code, confidence, name = detect_language(
            "Je suis un ingénieur logiciel avec une vaste expérience dans le développement d'applications web."
        )
        assert code == "fr"
        assert confidence > 0.5

    def test_short_text_defaults_to_english(self):
        from language_detector import detect_language
        code, confidence, name = detect_language("Hi")
        assert code == "en"
        assert confidence == 0.0

    def test_empty_text_defaults_to_english(self):
        from language_detector import detect_language
        code, confidence, name = detect_language("")
        assert code == "en"
        assert confidence == 0.0

    def test_get_language_info(self):
        from language_detector import get_language_info
        info = get_language_info("en")
        assert info is not None
        assert info["name"] == "English"

    def test_is_rtl_language_arabic(self):
        from language_detector import is_rtl_language
        assert is_rtl_language("ar") is True

    def test_is_rtl_language_english(self):
        from language_detector import is_rtl_language
        assert is_rtl_language("en") is False


# ==============================================
# ATS Scorer Unit Tests
# ==============================================

class TestATSScorer:
    """Tests for ats_scorer.py"""

    def test_ats_scorer_basic_resume(self):
        from ats_scorer import ATSScorer
        scorer = ATSScorer()
        result = scorer.score_resume(
            resume_text="""
            John Doe
            john@example.com | (555) 123-4567 | linkedin.com/in/johndoe

            PROFESSIONAL SUMMARY
            Experienced software engineer with 5+ years of experience.

            EXPERIENCE
            Senior Developer | Acme Corp | Jan 2020 - Present
            - Developed and maintained web applications using Python and Django
            - Improved deployment pipeline reducing deployment time by 40%
            - Led a team of 3 developers

            EDUCATION
            B.S. Computer Science | State University | 2015 - 2019

            SKILLS
            Python, Django, JavaScript, React, Docker, AWS, PostgreSQL, Git
            """,
            job_description="Looking for a Python developer with Django experience."
        )
        assert "overall_score" in result
        assert 0 <= result["overall_score"] <= 100
        assert "categories" in result

    def test_ats_scorer_empty_resume(self):
        from ats_scorer import ATSScorer
        scorer = ATSScorer()
        result = scorer.score_resume(resume_text="", job_description="Looking for a developer")
        assert result["overall_score"] >= 0

    def test_ats_scorer_detects_missing_sections(self):
        from ats_scorer import ATSScorer
        scorer = ATSScorer()
        result = scorer.score_resume(
            resume_text="Hello, I know Python.",
            job_description="Looking for a Python developer."
        )
        # Very minimal resume should score low
        assert result["overall_score"] < 70

    def test_ats_scorer_well_structured_resume_scores_higher(self):
        from ats_scorer import ATSScorer
        scorer = ATSScorer()

        well_structured = """
        Jane Smith
        jane@email.com | 555-111-2222 | github.com/janesmith

        SUMMARY
        Full-stack developer with 7 years of experience building scalable web apps.

        EXPERIENCE
        Lead Engineer | TechCo | March 2020 - Present
        - Architected microservices platform serving 1M+ requests daily
        - Reduced infrastructure costs by 35% through optimization
        - Mentored 5 junior developers

        Software Engineer | StartupXYZ | June 2017 - February 2020
        - Built RESTful APIs using Node.js and Express
        - Implemented CI/CD pipeline with GitHub Actions

        EDUCATION
        M.S. Computer Science | Tech University | 2017
        B.S. Computer Science | State University | 2015

        SKILLS
        Python, JavaScript, TypeScript, React, Node.js, Docker, Kubernetes, AWS, PostgreSQL

        CERTIFICATIONS
        AWS Certified Solutions Architect
        """

        minimal = "I know Python and JavaScript."

        score_good = scorer.score_resume(well_structured, "Full-stack developer needed")
        score_bad = scorer.score_resume(minimal, "Full-stack developer needed")

        assert score_good["overall_score"] > score_bad["overall_score"]


# ==============================================
# Profile Analyzer Unit Tests
# ==============================================

class TestProfileAnalyzer:
    """Tests for profile_analyzer.py"""

    def test_extract_github_url(self):
        from profile_analyzer import ProfileAnalyzer
        analyzer = ProfileAnalyzer()
        urls = analyzer.extract_urls("Check my work at https://github.com/octocat and more")
        assert urls["github"] == "https://github.com/octocat"
        assert urls["github_username"] == "octocat"

    def test_extract_linkedin_url(self):
        from profile_analyzer import ProfileAnalyzer
        analyzer = ProfileAnalyzer()
        urls = analyzer.extract_urls("LinkedIn: https://linkedin.com/in/johndoe")
        assert urls["linkedin"] == "https://linkedin.com/in/johndoe"
        assert urls["linkedin_username"] == "johndoe"

    def test_extract_no_urls(self):
        from profile_analyzer import ProfileAnalyzer
        analyzer = ProfileAnalyzer()
        urls = analyzer.extract_urls("I am a developer with no online profiles listed.")
        assert urls["github"] is None
        assert urls["linkedin"] is None

    def test_extract_both_urls(self):
        from profile_analyzer import ProfileAnalyzer
        analyzer = ProfileAnalyzer()
        text = "GitHub: https://github.com/testuser | LinkedIn: https://linkedin.com/in/testuser"
        urls = analyzer.extract_urls(text)
        assert urls["github_username"] == "testuser"
        assert urls["linkedin_username"] == "testuser"

    def test_extract_other_urls(self):
        from profile_analyzer import ProfileAnalyzer
        analyzer = ProfileAnalyzer()
        urls = analyzer.extract_urls("Portfolio: https://myportfolio.com")
        assert len(urls["other_urls"]) > 0


# ==============================================
# Security Module Unit Tests
# ==============================================

class TestFileValidator:
    """Tests for security/file_validator.py"""

    def test_validate_file_size_under_limit(self):
        from security.file_validator import validate_file_size
        content = b"x" * 1024  # 1KB
        is_valid, error = validate_file_size(content)
        assert is_valid is True
        assert error is None

    def test_validate_file_size_over_limit(self):
        from security.file_validator import validate_file_size, MAX_FILE_SIZE
        content = b"x" * (MAX_FILE_SIZE + 1)
        is_valid, error = validate_file_size(content)
        assert is_valid is False
        assert "too large" in error.lower()

    def test_validate_file_size_empty(self):
        from security.file_validator import validate_file_size
        is_valid, error = validate_file_size(b"")
        assert is_valid is False
        assert "empty" in error.lower()

    def test_sanitize_filename_safe(self):
        from security.file_validator import sanitize_filename
        sanitized, modified = sanitize_filename("my_resume.pdf")
        assert sanitized == "my_resume.pdf"
        assert modified is False

    def test_sanitize_filename_path_traversal(self):
        from security.file_validator import sanitize_filename
        sanitized, modified = sanitize_filename("../../etc/passwd")
        assert ".." not in sanitized
        assert "/" not in sanitized or sanitized == "passwd"

    def test_sanitize_filename_long_name(self):
        from security.file_validator import sanitize_filename
        long_name = "a" * 200 + ".pdf"
        sanitized, _ = sanitize_filename(long_name)
        assert len(sanitized) <= 105  # 100 char name + ext


# ==============================================
# Analyzer Unit Tests (Core ML)
# ==============================================

class TestResumeAnalyzer:
    """Tests for analyzer.py ResumeAnalyzer"""

    @pytest.fixture
    def analyzer(self):
        from analyzer import ResumeAnalyzer
        return ResumeAnalyzer()

    def test_analyzer_initializes(self, analyzer):
        assert analyzer is not None

    def test_extract_skills(self, analyzer):
        text = "I am proficient in Python, JavaScript, Docker, and PostgreSQL."
        skills = analyzer.extract_skills(text)
        skills_lower = [s.lower() for s in skills]
        assert "python" in skills_lower

    def test_analyze_text_returns_result(self, analyzer):
        result = analyzer.analyze_text(
            "Python developer with 5 years of experience in Django and REST APIs.",
            "Looking for a Python developer with Django experience."
        )
        assert "score" in result
        assert "skills_found" in result
        assert "missing_keywords" in result
        assert "feedback" in result

    def test_analyze_text_score_range(self, analyzer):
        result = analyzer.analyze_text(
            "Python developer with Django, Flask, REST APIs, PostgreSQL, Docker.",
            "Python backend developer needed."
        )
        assert 0 <= result["score"] <= 100

    def test_analyze_text_detects_language(self, analyzer):
        result = analyzer.analyze_text(
            "I am a Python developer with experience in Django and Flask web frameworks.",
            "Looking for a Python developer."
        )
        if "language" in result:
            assert result["language"]["language_code"] == "en"

    def test_matching_resume_scores_higher(self, analyzer):
        matching = analyzer.analyze_text(
            "Senior Python developer with Django, REST APIs, PostgreSQL, Docker, AWS experience.",
            "Senior Python developer with Django and AWS."
        )
        unrelated = analyzer.analyze_text(
            "Executive chef with 15 years of culinary experience in French restaurants.",
            "Senior Python developer with Django and AWS."
        )
        assert matching["score"] > unrelated["score"]

    def test_extract_contact_info(self, analyzer):
        text = "John Doe\njohn@example.com\n(555) 123-4567"
        contact = analyzer.extract_contact_info(text)
        assert contact is not None
        assert "email" in contact or "phone" in contact


# ==============================================
# Skills Module Unit Tests
# ==============================================

class TestSkillsModule:
    """Tests for skills/__init__.py"""

    def test_get_skills_for_english(self):
        from skills import get_skills_for_language
        skills = get_skills_for_language("en")
        assert len(skills) > 0

    def test_get_skills_for_spanish(self):
        from skills import get_skills_for_language
        skills = get_skills_for_language("es")
        assert len(skills) > 0

    def test_get_all_skills(self):
        from skills import get_all_skills
        all_skills = get_all_skills()
        assert len(all_skills) > 0

    def test_english_skills_contain_python(self):
        from skills import get_skills_for_language
        skills = get_skills_for_language("en")
        skills_lower = {s.lower() for s in skills}
        assert "python" in skills_lower
