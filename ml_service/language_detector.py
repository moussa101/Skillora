"""
Language Detection Module
Detects the language of resume text with confidence scoring
"""

from typing import Tuple, Optional
from langdetect import detect, detect_langs, LangDetectException
from langdetect.detector_factory import PROFILES_DIRECTORY

# Supported languages with their display names
SUPPORTED_LANGUAGES = {
    'en': {'name': 'English', 'flag': '🇺🇸'},
    'es': {'name': 'Spanish', 'flag': '🇪🇸'},
    'fr': {'name': 'French', 'flag': '🇫🇷'},
    'de': {'name': 'German', 'flag': '🇩🇪'},
    'zh-cn': {'name': 'Chinese (Simplified)', 'flag': '🇨🇳'},
    'zh-tw': {'name': 'Chinese (Traditional)', 'flag': '🇹🇼'},
    'ar': {'name': 'Arabic', 'flag': '🇸🇦'},
    'hi': {'name': 'Hindi', 'flag': '🇮🇳'},
    'pt': {'name': 'Portuguese', 'flag': '🇵🇹'},
    'ru': {'name': 'Russian', 'flag': '🇷🇺'},
    'ja': {'name': 'Japanese', 'flag': '🇯🇵'},
    'ko': {'name': 'Korean', 'flag': '🇰🇷'},
    'it': {'name': 'Italian', 'flag': '🇮🇹'},
    'nl': {'name': 'Dutch', 'flag': '🇳🇱'},
    'pl': {'name': 'Polish', 'flag': '🇵🇱'},
    'tr': {'name': 'Turkish', 'flag': '🇹🇷'},
    'vi': {'name': 'Vietnamese', 'flag': '🇻🇳'},
    'th': {'name': 'Thai', 'flag': '🇹🇭'},
    'id': {'name': 'Indonesian', 'flag': '🇮🇩'},
    'sv': {'name': 'Swedish', 'flag': '🇸🇪'},
}


def detect_language(text: str) -> Tuple[str, float, str]:
    """
    Detect the language of the given text.
    
    Args:
        text: The text to analyze
        
    Returns:
        Tuple of (language_code, confidence, language_name)
        e.g., ('en', 0.99, 'English')
    """
    if not text or len(text.strip()) < 20:
        # Not enough text to detect language reliably
        return 'en', 0.0, 'English'
    
    try:
        # Get language probabilities
        lang_probs = detect_langs(text)
        
        if not lang_probs:
            return 'en', 0.0, 'English'
        
        # Get the most likely language
        top_lang = lang_probs[0]
        lang_code = top_lang.lang
        confidence = top_lang.prob
        
        # Normalize Chinese language codes
        if lang_code == 'zh-cn' or lang_code == 'zh':
            lang_code = 'zh-cn'
        elif lang_code == 'zh-tw':
            lang_code = 'zh-tw'
        
        # Get language info
        lang_info = SUPPORTED_LANGUAGES.get(lang_code, {'name': lang_code.upper(), 'flag': '🌐'})
        
        return lang_code, confidence, lang_info['name']
        
    except LangDetectException as e:
        print(f"[WARN] Language detection failed: {e}")
        return 'en', 0.0, 'English'
    except Exception as e:
        print(f"[ERROR] Unexpected error in language detection: {e}")
        return 'en', 0.0, 'English'


def get_language_info(lang_code: str) -> dict:
    """
    Get display information for a language code.
    
    Args:
        lang_code: ISO 639-1 language code
        
    Returns:
        Dict with 'name' and 'flag' keys
    """
    return SUPPORTED_LANGUAGES.get(lang_code, {'name': lang_code.upper(), 'flag': '🌐'})


def is_rtl_language(lang_code: str) -> bool:
    """
    Check if the language is right-to-left.
    
    Args:
        lang_code: ISO 639-1 language code
        
    Returns:
        True if RTL, False otherwise
    """
    rtl_languages = {'ar', 'he', 'fa', 'ur'}
    return lang_code in rtl_languages


def get_supported_languages() -> list:
    """
    Get list of all supported languages.
    
    Returns:
        List of dicts with code, name, and flag
    """
    return [
        {'code': code, 'name': info['name'], 'flag': info['flag']}
        for code, info in SUPPORTED_LANGUAGES.items()
    ]
