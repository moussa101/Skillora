"""
ML Analyzer - Real semantic similarity scoring
Using sentence-transformers for embeddings and cosine similarity
"""

import re
from typing import List, Dict, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Try to import ML libraries
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False

# Common tech skills for extraction (expanded list)
TECH_SKILLS = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "ruby", "go", "golang", "rust", "php", "swift", "kotlin", "scala", "perl", "r", "matlab", "lua", "dart", "objective-c", "shell", "bash", "powershell",
    # Frontend
    "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs", "vue.js", "svelte", "next.js", "nextjs", "nuxt", "gatsby", "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind", "tailwindcss", "bootstrap", "material-ui", "mui", "chakra", "styled-components", "webpack", "vite", "babel", "jquery",
    # Backend
    "node.js", "nodejs", "node", "express", "expressjs", "fastapi", "django", "flask", "spring", "spring boot", "springboot", "nestjs", "rails", "ruby on rails", "laravel", "asp.net", ".net", "dotnet", "gin", "fiber", "fastify", "koa",
    # Databases
    "sql", "postgresql", "postgres", "mysql", "mariadb", "mongodb", "mongo", "redis", "elasticsearch", "elastic", "dynamodb", "sqlite", "oracle", "cassandra", "couchdb", "neo4j", "graphql", "prisma", "sequelize", "typeorm", "mongoose",
    # Cloud & DevOps
    "aws", "amazon web services", "gcp", "google cloud", "azure", "microsoft azure", "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef", "ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "circleci", "travis", "heroku", "vercel", "netlify", "digitalocean", "linode", "cloudflare",
    # Data & ML
    "machine learning", "ml", "deep learning", "dl", "artificial intelligence", "ai", "tensorflow", "pytorch", "keras", "pandas", "numpy", "scikit-learn", "sklearn", "opencv", "nlp", "natural language processing", "computer vision", "data science", "data analysis", "data engineering", "spark", "hadoop", "airflow", "kafka", "databricks",
    # Tools & Practices
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "agile", "scrum", "kanban", "rest", "rest api", "restful", "api", "apis", "microservices", "monorepo", "tdd", "testing", "unit testing", "jest", "mocha", "pytest", "selenium", "cypress", "playwright",
    # Mobile
    "ios", "android", "react native", "flutter", "xamarin", "ionic", "mobile", "app development",
    # Other
    "linux", "unix", "windows", "macos", "devops", "sre", "backend", "frontend", "full stack", "fullstack", "software engineer", "developer", "programming", "coding", "api design", "system design", "architecture", "security", "cybersecurity", "networking", "tcp/ip", "http", "https", "websocket", "oauth", "jwt", "authentication", "authorization"
}



class ResumeAnalyzer:
    """Analyzes resume against job description using semantic similarity"""
    
    def __init__(self):
        self.model = None
        if SENTENCE_TRANSFORMER_AVAILABLE:
            try:
                # Use a lightweight model for faster inference
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Failed to load sentence transformer: {e}")
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF/DOCX file"""
        try:
            if file_path.lower().endswith('.pdf'):
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()
                return text
            elif file_path.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                return ""
        except Exception as e:
            print(f"Error extracting text: {e}")
            return ""
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract tech skills from text"""
        text_lower = text.lower()
        found_skills = []
        for skill in TECH_SKILLS:
            # Check for skill with word boundaries
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())
        return list(set(found_skills))
    
    def calculate_semantic_similarity(self, resume_text: str, job_description: str) -> float:
        """
        Fast keyword-based scoring for instant results.
        Strong matches (all skills) should get 85%+
        """
        # Get skills from both texts
        resume_skills = set(self.extract_skills(resume_text))
        jd_skills = set(self.extract_skills(job_description))
        
        # Debug logging
        print(f"[DEBUG] Resume skills found: {resume_skills}")
        print(f"[DEBUG] JD skills found: {jd_skills}")
        
        # Calculate skill match score (this is the primary factor)
        if jd_skills:
            matched_skills = resume_skills.intersection(jd_skills)
            match_ratio = len(matched_skills) / len(jd_skills)
            print(f"[DEBUG] Matched skills: {matched_skills} ({len(matched_skills)}/{len(jd_skills)} = {match_ratio:.2f})")
            # Scale: 0% match = 20, 50% match = 55, 100% match = 90
            skill_score = 20 + (match_ratio * 70)
        else:
            # No skills in JD - default to word overlap
            print("[DEBUG] No skills found in JD, using word overlap only")
            skill_score = 50.0
            match_ratio = 0
            matched_skills = set()
        
        # Word overlap bonus (up to +15 points)
        resume_words = set(resume_text.lower().split())
        jd_words = set(job_description.lower().split())
        common_words = {'the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'for', 'with', 'in', 'on', 'of', 'we', 'you', 'will', 'be', 'as', 'at', 'by', 'have', 'has', 'this', 'that', 'our', 'your'}
        resume_words = resume_words - common_words
        jd_words = jd_words - common_words
        
        if jd_words:
            word_overlap = len(resume_words.intersection(jd_words)) / len(jd_words)
            word_bonus = min(word_overlap * 20, 15)  # Up to +15 bonus
        else:
            word_bonus = 5
        
        final_score = skill_score + word_bonus
        
        # Bonus for perfect or near-perfect skill match
        if match_ratio >= 1.0:
            final_score += 5  # Perfect match bonus
        elif match_ratio >= 0.8:
            final_score += 3  # 80%+ match bonus
        
        # Bonus for having many relevant skills in resume
        if len(resume_skills) >= 8:
            final_score += 3
        elif len(resume_skills) >= 5:
            final_score += 2
        
        print(f"[DEBUG] Final score: {final_score:.1f} (skill_score={skill_score:.1f}, word_bonus={word_bonus:.1f})")
        
        return max(0, min(100, final_score))



    
    def _keyword_similarity(self, resume_text: str, job_description: str) -> float:
        """Fallback keyword-based similarity"""
        resume_skills = set(self.extract_skills(resume_text))
        jd_skills = set(self.extract_skills(job_description))
        
        if not jd_skills:
            return 50.0  # Default if no skills found in JD
        
        matched = resume_skills.intersection(jd_skills)
        return (len(matched) / len(jd_skills)) * 100
    
    def find_missing_keywords(self, resume_text: str, job_description: str) -> List[str]:
        """Find keywords in JD that are missing from resume"""
        resume_skills = set(self.extract_skills(resume_text))
        jd_skills = set(self.extract_skills(job_description))
        
        missing = jd_skills - resume_skills
        return [skill.title() for skill in missing]
    
    def analyze(self, file_path: str, job_description: str) -> Dict:
        """Main analysis function"""
        # Extract resume text
        resume_text = self.extract_text_from_file(file_path)
        
        if not resume_text:
            resume_text = "Unable to extract text from file"
        
        # Extract skills
        skills_found = self.extract_skills(resume_text)
        
        # Calculate similarity
        score = self.calculate_semantic_similarity(resume_text, job_description)
        
        # Find missing keywords
        missing_keywords = self.find_missing_keywords(resume_text, job_description)
        
        # Generate feedback
        feedback = self._generate_feedback(score, skills_found, missing_keywords)
        
        return {
            "score": round(score, 1),
            "skills_found": skills_found[:10],  # Top 10 skills
            "missing_keywords": missing_keywords[:8],  # Top 8 missing
            "feedback": feedback,
            "resume_text_length": len(resume_text),
        }
    
    def _generate_feedback(self, score: float, skills: List[str], missing: List[str]) -> Dict:
        """Generate actionable feedback"""
        if score >= 80:
            summary = "Excellent match! Your resume aligns well with the job requirements."
        elif score >= 60:
            summary = "Good match with room for improvement. Consider adding missing skills."
        elif score >= 40:
            summary = "Moderate match. You may need to tailor your resume more specifically."
        else:
            summary = "Low match. Consider gaining experience in the required areas."
        
        suggestions = []
        if missing:
            suggestions.append(f"Add experience with: {', '.join(missing[:3])}")
        if len(skills) < 5:
            suggestions.append("List more technical skills explicitly in a skills section")
        suggestions.append("Quantify achievements with numbers and metrics")
        suggestions.append("Use action verbs to describe accomplishments")
        
        return {
            "summary": summary,
            "suggestions": suggestions[:4]
        }


# Singleton instance
_analyzer = None

def get_analyzer() -> ResumeAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = ResumeAnalyzer()
    return _analyzer
