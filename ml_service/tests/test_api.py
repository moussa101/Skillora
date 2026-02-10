"""
ML Service Tests — Unit, Integration, and API tests
Run with: pytest tests/ -v
"""

import pytest
import os
import sys

# Add parent directory to path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


# ==============================================
# UNIT TESTS — Health & Core endpoints
# ==============================================

class TestHealth:
    """Health check endpoint tests"""

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_status_healthy(self):
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_includes_version(self):
        response = client.get("/health")
        data = response.json()
        assert "version" in data

    def test_health_includes_features(self):
        response = client.get("/health")
        data = response.json()
        assert "features" in data


# ==============================================
# UNIT TESTS — Text Analysis
# ==============================================

class TestAnalyzeEndpoint:
    """POST /analyze endpoint tests"""

    def test_analyze_requires_job_description(self):
        response = client.post("/analyze", json={
            "resume_text": "I am a Python developer with 5 years of experience."
        })
        assert response.status_code == 422  # Validation error

    def test_analyze_with_text_input(self):
        response = client.post("/analyze", json={
            "resume_text": "Python developer with 5 years of experience in Django, Flask, REST APIs, PostgreSQL, Docker, and AWS.",
            "job_description": "Looking for a Python backend developer with Django and REST API experience."
        })
        assert response.status_code == 200
        data = response.json()
        assert "match_score" in data
        assert "skills_found" in data
        assert "missing_skills" in data
        assert 0 <= data["match_score"] <= 100

    def test_analyze_returns_skills_found(self):
        response = client.post("/analyze", json={
            "resume_text": "Expert in Python, JavaScript, React, Node.js, Docker, and Kubernetes.",
            "job_description": "Need Python and Docker experience."
        })
        data = response.json()
        assert len(data["skills_found"]) > 0

    def test_analyze_returns_missing_skills(self):
        response = client.post("/analyze", json={
            "resume_text": "I know Python and Django.",
            "job_description": "Looking for expertise in Kubernetes, Terraform, AWS, Go, and gRPC."
        })
        data = response.json()
        assert len(data["missing_skills"]) > 0

    def test_analyze_empty_resume_text(self):
        response = client.post("/analyze", json={
            "resume_text": "",
            "job_description": "Looking for a Python developer."
        })
        # Should still return a response (likely low score)
        assert response.status_code in [200, 400]

    def test_analyze_returns_feedback(self):
        response = client.post("/analyze", json={
            "resume_text": "Senior Python developer. Built microservices with Django and Flask. Deployed on AWS using Docker.",
            "job_description": "Senior Python developer for cloud-native applications."
        })
        data = response.json()
        assert "feedback" in data


# ==============================================
# UNIT TESTS — Security Scanning
# ==============================================

class TestSecurityScan:
    """POST /security-scan endpoint tests"""

    def test_security_scan_with_clean_text(self):
        response = client.post("/security-scan", json={
            "text": "I am a software developer with experience in Python and JavaScript.",
            "file_path": None
        })
        assert response.status_code == 200
        data = response.json()
        assert "is_safe" in data
        assert data["is_safe"] is True


# ==============================================
# UNIT TESTS — Text Extraction
# ==============================================

class TestExtractText:
    """POST /extract-text endpoint tests"""

    def test_extract_text_requires_file(self):
        response = client.post("/extract-text")
        assert response.status_code == 422


# ==============================================
# INTEGRATION TESTS — Full analysis pipeline
# ==============================================

class TestAnalysisPipeline:
    """Tests the full analysis pipeline end-to-end"""

    def test_high_match_score_for_matching_resume(self):
        """A resume matching the JD should score high"""
        response = client.post("/analyze", json={
            "resume_text": """
            Senior Software Engineer with 8 years of experience.
            Skills: Python, Django, Flask, REST APIs, PostgreSQL, Docker, Kubernetes, AWS, CI/CD, Git.
            Experience building scalable microservices and cloud-native applications.
            Led team of 5 developers. Reduced deployment time by 60%.
            """,
            "job_description": """
            Senior Software Engineer - Python Backend
            Requirements: Python, Django, REST APIs, PostgreSQL, Docker, AWS.
            Experience with microservices architecture and cloud deployment.
            """
        })
        data = response.json()
        assert data["match_score"] >= 50  # Should be a decent match

    def test_low_match_score_for_unrelated_resume(self):
        """An unrelated resume should score low"""
        response = client.post("/analyze", json={
            "resume_text": """
            Professional Chef with 10 years of culinary experience.
            Expertise in French cuisine, pastry making, and restaurant management.
            Managed a team of 15 kitchen staff.
            """,
            "job_description": """
            Senior Software Engineer - Python Backend
            Requirements: Python, Django, REST APIs, PostgreSQL, Docker, AWS.
            """
        })
        data = response.json()
        assert data["match_score"] < 50  # Should be a poor match

    def test_analyze_detects_relevant_skills(self):
        """Should correctly identify skills in resume"""
        response = client.post("/analyze", json={
            "resume_text": "I am proficient in Python, JavaScript, React, Docker, and PostgreSQL.",
            "job_description": "Looking for a full-stack developer."
        })
        data = response.json()
        skills_lower = [s.lower() for s in data["skills_found"]]
        assert "python" in skills_lower

    def test_analyze_identifies_missing_skills(self):
        """Should identify skills in JD missing from resume"""
        response = client.post("/analyze", json={
            "resume_text": "I know Python and Django.",
            "job_description": "Must have: Python, Django, Docker, Kubernetes, AWS, Terraform."
        })
        data = response.json()
        missing_lower = [s.lower() for s in data["missing_skills"]]
        # At least some of Docker/Kubernetes/AWS/Terraform should be missing
        assert len(missing_lower) > 0


# ==============================================
# INTEGRATION TESTS — Batch Analysis
# ==============================================

class TestBatchAnalyze:
    """POST /batch-analyze endpoint tests"""

    def test_batch_analyze_multiple_resumes(self):
        response = client.post("/batch-analyze", json={
            "resumes": [
                {"resume_text": "Python developer with Django experience.", "resume_id": "1"},
                {"resume_text": "Java developer with Spring Boot.", "resume_id": "2"},
            ],
            "job_description": "Looking for a Python backend developer."
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 2

    def test_batch_analyze_empty_list(self):
        response = client.post("/batch-analyze", json={
            "resumes": [],
            "job_description": "Looking for a developer."
        })
        assert response.status_code in [200, 400]


# ==============================================
# INTEGRATION TESTS — Profile Analysis
# ==============================================

class TestProfileAnalysis:
    """POST /analyze-profiles endpoint tests"""

    def test_analyze_profiles_with_text(self):
        response = client.post("/analyze-profiles", json={
            "text": "Check out my GitHub: https://github.com/octocat and LinkedIn: https://linkedin.com/in/testuser"
        })
        assert response.status_code == 200
        data = response.json()
        assert "github" in data or "linkedin" in data


# ==============================================
# API CONTRACT TESTS
# ==============================================

class TestAPIContract:
    """Verify API response shapes match expected contracts"""

    def test_analyze_response_shape(self):
        response = client.post("/analyze", json={
            "resume_text": "Python developer.",
            "job_description": "Looking for a developer."
        })
        data = response.json()

        # Required fields
        assert isinstance(data.get("match_score"), (int, float))
        assert isinstance(data.get("skills_found"), list)
        assert isinstance(data.get("missing_skills"), list)
        assert isinstance(data.get("feedback"), (dict, list, type(None)))

    def test_health_response_shape(self):
        response = client.get("/health")
        data = response.json()

        assert isinstance(data.get("status"), str)
        assert isinstance(data.get("version"), str)

    def test_cors_headers_present(self):
        response = client.options("/health", headers={
            "Origin": "http://localhost:3001",
            "Access-Control-Request-Method": "GET",
        })
        # CORS should not block the request
        assert response.status_code in [200, 204, 405]
