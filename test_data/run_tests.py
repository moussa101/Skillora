#!/usr/bin/env python3
"""
Comprehensive test script for AI Resume Analyzer.
Tests all resume formats (TXT, PDF, DOCX) against all job descriptions.
"""

import os
import sys
import json
import time
import requests
from pathlib import Path

# API endpoints
BACKEND_URL = "http://localhost:3000"
ML_SERVICE_URL = "http://localhost:8000"

# Test data directory
TEST_DATA_DIR = Path(__file__).parent

def test_ml_service_health():
    """Check if ML service is healthy."""
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        data = response.json()
        print(f"✓ ML Service: {data['status']} (v{data['version']})")
        return True
    except Exception as e:
        print(f"✗ ML Service Error: {e}")
        return False

def test_backend_health():
    """Check if backend is healthy."""
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        print(f"✓ Backend: OK")
        return True
    except Exception as e:
        print(f"✗ Backend Error: {e}")
        return False

def analyze_resume_direct(resume_path: str, job_description: str):
    """Send resume directly to ML service for analysis."""
    with open(resume_path, 'rb') as f:
        files = {'file': (os.path.basename(resume_path), f)}
        data = {'job_description': job_description}
        
        response = requests.post(
            f"{ML_SERVICE_URL}/analyze-file",
            files=files,
            data=data,
            timeout=120
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": response.text, "status_code": response.status_code}

def load_job_description(jd_path: str) -> str:
    """Load job description from file."""
    with open(jd_path, 'r', encoding='utf-8') as f:
        return f.read()

def format_result(result: dict) -> str:
    """Format analysis result for display."""
    if "error" in result:
        return f"ERROR: {result['error']}"
    
    output = []
    
    # Match score
    score = result.get('match_score', result.get('overall_score', 0))
    if isinstance(score, float):
        score = int(score * 100) if score <= 1 else int(score)
    output.append(f"Score: {score}%")
    
    # Skills found
    skills = result.get('skills_found', result.get('matched_skills', []))
    if skills:
        output.append(f"Skills: {len(skills)} found")
    
    # Missing keywords
    missing = result.get('missing_keywords', result.get('missing_skills', []))
    if missing:
        output.append(f"Missing: {len(missing)}")
    
    return " | ".join(output)

def run_tests():
    """Run all test scenarios."""
    print("=" * 70)
    print("AI RESUME ANALYZER - COMPREHENSIVE TEST SUITE")
    print("=" * 70)
    print()
    
    # Health checks
    print("HEALTH CHECKS")
    print("-" * 40)
    ml_ok = test_ml_service_health()
    backend_ok = test_backend_health()
    print()
    
    if not ml_ok:
        print("ERROR: ML Service is not running. Exiting.")
        return False
    
    # Define test files
    resumes = {
        "Software Engineer": TEST_DATA_DIR / "resumes",
        "Data Scientist": TEST_DATA_DIR / "resumes", 
        "Junior Developer": TEST_DATA_DIR / "resumes"
    }
    
    resume_files = [
        ("Software Engineer", "software_engineer_resume"),
        ("Data Scientist", "data_scientist_resume"),
        ("Junior Developer", "junior_developer_resume")
    ]
    
    jd_files = [
        ("Senior SWE JD", "senior_software_engineer_jd"),
        ("Data Scientist JD", "data_scientist_jd"),
        ("Junior Dev JD", "junior_developer_jd")
    ]
    
    formats = [".txt", ".pdf", ".docx"]
    
    # Results storage
    results = []
    
    # Run tests
    print("RUNNING ANALYSIS TESTS")
    print("-" * 70)
    
    for resume_name, resume_base in resume_files:
        for fmt in formats:
            resume_path = TEST_DATA_DIR / "resumes" / f"{resume_base}{fmt}"
            
            if not resume_path.exists():
                print(f"⚠ File not found: {resume_path}")
                continue
            
            for jd_name, jd_base in jd_files:
                jd_path = TEST_DATA_DIR / "job_descriptions" / f"{jd_base}.txt"
                
                if not jd_path.exists():
                    print(f"⚠ JD not found: {jd_path}")
                    continue
                
                jd_text = load_job_description(str(jd_path))
                
                print(f"\nTest: {resume_name} ({fmt}) vs {jd_name}")
                print(f"  Resume: {resume_path.name}")
                
                try:
                    start_time = time.time()
                    result = analyze_resume_direct(str(resume_path), jd_text)
                    elapsed = time.time() - start_time
                    
                    formatted = format_result(result)
                    print(f"  Result: {formatted} ({elapsed:.2f}s)")
                    
                    results.append({
                        "resume": resume_name,
                        "format": fmt,
                        "job_description": jd_name,
                        "result": result,
                        "time": elapsed
                    })
                    
                except Exception as e:
                    print(f"  ERROR: {e}")
                    results.append({
                        "resume": resume_name,
                        "format": fmt,
                        "job_description": jd_name,
                        "error": str(e)
                    })
    
    # Summary
    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    successful = [r for r in results if "error" not in r.get("result", {})]
    failed = [r for r in results if "error" in r.get("result", {}) or "error" in r]
    
    print(f"Total Tests: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed Tests:")
        for f in failed:
            print(f"  - {f['resume']} ({f['format']}) vs {f['job_description']}")
    
    # Save results to file
    results_path = TEST_DATA_DIR / "test_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to: {results_path}")
    
    return len(failed) == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
