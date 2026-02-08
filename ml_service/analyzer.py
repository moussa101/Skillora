"""
ML Analyzer - Multilingual semantic similarity scoring
Using sentence-transformers for embeddings and cosine similarity
Supports multiple languages with automatic language detection
"""

import re
from typing import List, Dict, Tuple, Optional, Set
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Try to import ML libraries
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False

# Try to import language detection
try:
    from language_detector import detect_language, get_language_info, is_rtl_language
    LANGUAGE_DETECTION_AVAILABLE = True
except ImportError:
    LANGUAGE_DETECTION_AVAILABLE = False
    
# Try to import multilingual skills
try:
    from skills import get_skills_for_language, get_all_skills
    MULTILINGUAL_SKILLS_AVAILABLE = True
except ImportError:
    MULTILINGUAL_SKILLS_AVAILABLE = False

# Fallback: Common tech skills for extraction (used if skills module not available)
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
    """
    Analyzes resume against job description using semantic similarity.
    Supports multiple languages with automatic language detection.
    """
    
    def __init__(self, use_multilingual: bool = True):
        """
        Initialize the analyzer.
        
        Args:
            use_multilingual: If True, use multilingual model for cross-language support
        """
        self.model = None
        self.use_multilingual = use_multilingual
        
        if SENTENCE_TRANSFORMER_AVAILABLE:
            try:
                if use_multilingual:
                    # Multilingual model supports 50+ languages
                    print("[INFO] Loading multilingual sentence transformer model...")
                    self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
                    print("[INFO] Multilingual model loaded successfully")
                else:
                    # Lightweight English-only model
                    self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"[WARN] Failed to load sentence transformer: {e}")
                # Try fallback to English model
                try:
                    self.model = SentenceTransformer('all-MiniLM-L6-v2')
                except Exception as e2:
                    print(f"[ERROR] Fallback model also failed: {e2}")
    
    def detect_resume_language(self, text: str) -> Dict:
        """
        Detect the language of the resume text.
        
        Args:
            text: Resume text content
            
        Returns:
            Dict with language_code, confidence, language_name, is_rtl
        """
        if not LANGUAGE_DETECTION_AVAILABLE:
            return {
                'language_code': 'en',
                'confidence': 1.0,
                'language_name': 'English',
                'is_rtl': False
            }
        
        lang_code, confidence, lang_name = detect_language(text)
        
        return {
            'language_code': lang_code,
            'confidence': round(confidence, 2),
            'language_name': lang_name,
            'is_rtl': is_rtl_language(lang_code)
        }
    
    def get_skills_dictionary(self, lang_code: str) -> Set[str]:
        """
        Get the appropriate skills dictionary for the detected language.
        
        Args:
            lang_code: ISO 639-1 language code
            
        Returns:
            Set of skills for that language
        """
        if MULTILINGUAL_SKILLS_AVAILABLE:
            return get_skills_for_language(lang_code)
        return TECH_SKILLS
    
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
    
    def extract_skills(self, text: str, lang_code: str = 'en') -> List[str]:
        """
        Extract tech skills from text using language-appropriate dictionary.
        
        Args:
            text: Text to analyze
            lang_code: Language code for skill dictionary selection
            
        Returns:
            List of found skills
        """
        text_lower = text.lower()
        skills_dict = self.get_skills_dictionary(lang_code)
        found_skills = []
        
        for skill in skills_dict:
            # Check for skill with word boundaries
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())
        
        return list(set(found_skills))
    
    def calculate_semantic_similarity(self, resume_text: str, job_description: str, lang_code: str = 'en') -> float:
        """
        Calculate similarity score between resume and job description.
        Supports multilingual analysis.
        
        Args:
            resume_text: Resume text content
            job_description: Job description text
            lang_code: Detected language code
            
        Returns:
            Similarity score (0-100)
        """
        # Get skills from both texts using language-appropriate dictionary
        resume_skills = set(self.extract_skills(resume_text, lang_code))
        jd_skills = set(self.extract_skills(job_description, lang_code))
        
        # Debug logging
        print(f"[DEBUG] Language: {lang_code}")
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
            # No skills in JD - use semantic similarity if model available
            print("[DEBUG] No skills found in JD, using semantic analysis")
            if self.model:
                try:
                    embeddings = self.model.encode([resume_text[:2000], job_description[:2000]])
                    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                    skill_score = 30 + (similarity * 60)  # Scale 30-90
                except Exception as e:
                    print(f"[WARN] Semantic similarity failed: {e}")
                    skill_score = 50.0
            else:
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
    
    def find_missing_keywords(self, resume_text: str, job_description: str, lang_code: str = 'en') -> List[str]:
        """Find keywords in JD that are missing from resume"""
        resume_skills = set(self.extract_skills(resume_text, lang_code))
        jd_skills = set(self.extract_skills(job_description, lang_code))
        
        missing = jd_skills - resume_skills
        return [skill.title() for skill in missing]
    
    def analyze(self, file_path: str, job_description: str) -> Dict:
        """
        Main analysis function with automatic language detection.
        
        Args:
            file_path: Path to resume file
            job_description: Job description text
            
        Returns:
            Analysis results including language info, score, skills, and feedback
        """
        # Extract resume text
        resume_text = self.extract_text_from_file(file_path)
        
        if not resume_text:
            resume_text = "Unable to extract text from file"
        
        # Detect resume language
        language_info = self.detect_resume_language(resume_text)
        lang_code = language_info['language_code']
        
        print(f"[INFO] Detected language: {language_info['language_name']} ({lang_code}) with {language_info['confidence']:.0%} confidence")
        
        # Extract skills using language-appropriate dictionary
        skills_found = self.extract_skills(resume_text, lang_code)
        
        # Calculate similarity
        score = self.calculate_semantic_similarity(resume_text, job_description, lang_code)
        
        # Find missing keywords
        missing_keywords = self.find_missing_keywords(resume_text, job_description, lang_code)
        
        # Generate feedback
        feedback = self._generate_feedback(score, skills_found, missing_keywords, language_info)
        
        return {
            "score": round(score, 1),
            "skills_found": skills_found[:10],  # Top 10 skills
            "missing_keywords": missing_keywords[:8],  # Top 8 missing
            "feedback": feedback,
            "resume_text_length": len(resume_text),
            "language": language_info,
        }
    
    def analyze_text(self, resume_text: str, job_description: str) -> Dict:
        """
        Analyze resume text directly (without file extraction).
        
        Args:
            resume_text: Resume text content
            job_description: Job description text
            
        Returns:
            Analysis results including language info
        """
        # Detect resume language
        language_info = self.detect_resume_language(resume_text)
        lang_code = language_info['language_code']
        
        print(f"[INFO] Detected language: {language_info['language_name']} ({lang_code}) with {language_info['confidence']:.0%} confidence")
        
        # Extract skills using language-appropriate dictionary
        skills_found = self.extract_skills(resume_text, lang_code)
        
        # Calculate similarity
        score = self.calculate_semantic_similarity(resume_text, job_description, lang_code)
        
        # Find missing keywords
        missing_keywords = self.find_missing_keywords(resume_text, job_description, lang_code)
        
        # Generate feedback
        feedback = self._generate_feedback(score, skills_found, missing_keywords, language_info)
        
        return {
            "score": round(score, 1),
            "skills_found": skills_found[:10],
            "missing_keywords": missing_keywords[:8],
            "feedback": feedback,
            "resume_text_length": len(resume_text),
            "language": language_info,
        }
    
    def _generate_feedback(self, score: float, skills: List[str], missing: List[str], language_info: Dict = None) -> Dict:
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
        
        # Add language-specific suggestions if applicable
        if language_info and language_info.get('language_code') != 'en':
            suggestions.append(f"Resume detected as {language_info['language_name']}. Consider having an English version for international positions.")
        
        return {
            "summary": summary,
            "suggestions": suggestions[:4]
        }


# Singleton instance
_analyzer = None

def get_analyzer() -> ResumeAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = ResumeAnalyzer(use_multilingual=True)
    return _analyzer
