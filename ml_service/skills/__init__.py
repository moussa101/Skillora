"""
Multilingual Skills Module
Loads and manages skill dictionaries for multiple languages
"""

from typing import Set, Dict, Optional

# Import language-specific skills
from .skills_en import TECH_SKILLS_EN
from .skills_es import TECH_SKILLS_ES
from .skills_fr import TECH_SKILLS_FR
from .skills_de import TECH_SKILLS_DE
from .skills_zh import TECH_SKILLS_ZH
from .skills_ar import TECH_SKILLS_AR

# Map of language codes to their skill dictionaries
SKILLS_BY_LANGUAGE = {
    'en': TECH_SKILLS_EN,
    'es': TECH_SKILLS_ES,
    'fr': TECH_SKILLS_FR,
    'de': TECH_SKILLS_DE,
    'zh-cn': TECH_SKILLS_ZH,
    'zh-tw': TECH_SKILLS_ZH,
    'ar': TECH_SKILLS_AR,
}

# Universal skills that appear the same across all languages (tech terms)
UNIVERSAL_SKILLS = {
    # Programming languages (same in all languages)
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "ruby", "go", "rust", "php", "swift", "kotlin", "scala",
    # Frameworks (same in all languages)
    "react", "angular", "vue", "django", "flask", "fastapi", "spring", "node.js", "express",
    # Tools (same in all languages)
    "docker", "kubernetes", "git", "github", "aws", "azure", "gcp",
    # Databases (same in all languages)
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
}


def get_skills_for_language(lang_code: str) -> Set[str]:
    """
    Get the complete skill set for a given language.
    Combines language-specific skills with universal skills.
    
    Args:
        lang_code: ISO 639-1 language code (e.g., 'en', 'es', 'fr')
        
    Returns:
        Set of skills for that language
    """
    # Get language-specific skills
    lang_skills = SKILLS_BY_LANGUAGE.get(lang_code, SKILLS_BY_LANGUAGE['en'])
    
    # Combine with universal skills
    return lang_skills.union(UNIVERSAL_SKILLS)


def get_all_skills() -> Set[str]:
    """
    Get all skills from all languages combined.
    Useful for comprehensive skill extraction.
    
    Returns:
        Set of all skills across all languages
    """
    all_skills = set(UNIVERSAL_SKILLS)
    for skills in SKILLS_BY_LANGUAGE.values():
        all_skills.update(skills)
    return all_skills


def get_supported_skill_languages() -> list:
    """
    Get list of languages with dedicated skill dictionaries.
    
    Returns:
        List of language codes
    """
    return list(SKILLS_BY_LANGUAGE.keys())
