#!/usr/bin/env python3
"""
Real-World Test Suite for AI Resume Analyzer
Tests with realistic job postings and CVs
"""

import requests
import json
from pathlib import Path

ML_SERVICE_URL = "http://localhost:8000"
TEST_DIR = Path(__file__).parent

def analyze(resume_path: str, job_description: str) -> dict:
    """Analyze a resume against a job description"""
    with open(resume_path, 'rb') as f:
        files = {'file': (Path(resume_path).name, f, 'text/plain')}
        data = {'job_description': job_description}
        response = requests.post(
            f"{ML_SERVICE_URL}/analyze-file",
            files=files,
            data=data,
            timeout=60
        )
        response.raise_for_status()
        return response.json()

def run_real_world_tests():
    """Run real-world test scenarios"""
    
    print("=" * 70)
    print("REAL-WORLD TEST SCENARIOS")
    print("=" * 70)
    print()
    
    # Load job postings
    job_postings = {
        "Google SWE III": TEST_DIR / "job_postings" / "google_swe3_cloud.txt",
        "Amazon Data Scientist": TEST_DIR / "job_postings" / "amazon_data_scientist.txt", 
        "Meta Frontend": TEST_DIR / "job_postings" / "meta_frontend_engineer.txt"
    }
    
    # Load resumes
    resumes = {
        "Michael Chen (SWE)": TEST_DIR / "resumes" / "michael_chen_swe.txt",
        "Rachel Martinez (DS)": TEST_DIR / "resumes" / "rachel_martinez_ds.txt",
        "James Thompson (FE)": TEST_DIR / "resumes" / "james_thompson_fe.txt",
        "Ashley Nguyen (Junior)": TEST_DIR / "resumes" / "ashley_nguyen_junior.txt"
    }
    
    # Expected match levels
    expected = {
        ("Michael Chen (SWE)", "Google SWE III"): "HIGH",    # Good match - SWE to SWE
        ("Michael Chen (SWE)", "Amazon Data Scientist"): "LOW",  # Poor match - SWE to DS
        ("Michael Chen (SWE)", "Meta Frontend"): "MEDIUM",   # Some overlap
        
        ("Rachel Martinez (DS)", "Google SWE III"): "MEDIUM",  # Some engineering skills
        ("Rachel Martinez (DS)", "Amazon Data Scientist"): "HIGH",  # Excellent match
        ("Rachel Martinez (DS)", "Meta Frontend"): "LOW",    # Poor match
        
        ("James Thompson (FE)", "Google SWE III"): "MEDIUM",  # Some overlap
        ("James Thompson (FE)", "Amazon Data Scientist"): "LOW",  # Poor match
        ("James Thompson (FE)", "Meta Frontend"): "HIGH",    # Excellent match
        
        ("Ashley Nguyen (Junior)", "Google SWE III"): "LOW",  # Junior, missing skills
        ("Ashley Nguyen (Junior)", "Amazon Data Scientist"): "LOW",  # No DS skills
        ("Ashley Nguyen (Junior)", "Meta Frontend"): "LOW",   # Limited React experience
    }
    
    results = []
    
    for resume_name, resume_path in resumes.items():
        print(f"\nCandidate: {resume_name}")
        print("-" * 50)
        
        for job_name, job_path in job_postings.items():
            jd_text = job_path.read_text()
            
            try:
                result = analyze(str(resume_path), jd_text)
                score = result.get('score', 0)
                skills = result.get('skills_found', [])
                missing = result.get('missing_keywords', [])
                
                # Determine actual match level
                if score >= 75:
                    actual = "HIGH"
                elif score >= 50:
                    actual = "MEDIUM"
                else:
                    actual = "LOW"
                
                expected_level = expected.get((resume_name, job_name), "UNKNOWN")
                match_icon = "✓" if actual == expected_level else "≠"
                
                print(f"  vs {job_name}: {score}% [{actual}] {match_icon}")
                print(f"     Skills: {len(skills)} found | Missing: {len(missing)}")
                
                results.append({
                    "resume": resume_name,
                    "job": job_name,
                    "score": score,
                    "actual_level": actual,
                    "expected_level": expected_level,
                    "match": actual == expected_level,
                    "skills_found": skills[:5],  # Top 5
                    "missing_keywords": missing[:5],  # Top 5
                    "suspicious": result.get('suspicious', False)
                })
                
            except Exception as e:
                print(f"  vs {job_name}: ERROR - {str(e)}")
                results.append({
                    "resume": resume_name,
                    "job": job_name,
                    "error": str(e)
                })
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    successful = [r for r in results if 'error' not in r]
    correct = [r for r in successful if r['match']]
    
    print(f"Total Tests: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Expectation Match: {len(correct)}/{len(successful)} ({100*len(correct)//len(successful) if successful else 0}%)")
    
    # Score distribution
    print("\nScore Distribution:")
    for r in successful:
        bar = "█" * (int(r['score']) // 5)
        print(f"  {r['resume'][:20]:20} vs {r['job'][:20]:20}: {r['score']:3}% {bar}")
    
    # Save results
    output_file = TEST_DIR / "test_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {output_file}")

if __name__ == "__main__":
    run_real_world_tests()
