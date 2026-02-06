"""
File Upload Security Module
Implements additional security measures for file uploads
"""
import re
import os
from typing import Tuple, Optional

# File size limit (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes

# MIME type mappings for validation
ALLOWED_MIME_TYPES = {
    '.pdf': ['application/pdf'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.txt': ['text/plain'],
    '.rtf': ['application/rtf', 'text/rtf'],
    '.html': ['text/html'],
    '.htm': ['text/html'],
}

# Dangerous filename patterns
DANGEROUS_PATTERNS = [
    r'\.\.',           # Path traversal
    r'[<>:"|?*]',      # Windows invalid chars
    r'[\x00-\x1f]',    # Control characters
    r'^\.+$',          # Only dots
    r'^\s|\s$',        # Leading/trailing whitespace
]


def validate_file_size(content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate file size against maximum limit.
    Returns (is_valid, error_message)
    """
    size = len(content)
    if size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB, got {size // (1024*1024)}MB"
    if size == 0:
        return False, "File is empty"
    return True, None


def validate_mime_type(content: bytes, file_ext: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that file content matches its extension using magic bytes.
    Returns (is_valid, error_message)
    """
    try:
        import magic
        detected_mime = magic.from_buffer(content, mime=True)
        
        expected_mimes = ALLOWED_MIME_TYPES.get(file_ext.lower(), [])
        
        # Special handling for text files which may be detected differently
        if file_ext in ['.txt', '.rtf', '.html', '.htm']:
            if detected_mime.startswith('text/') or detected_mime in expected_mimes:
                return True, None
        
        if detected_mime in expected_mimes:
            return True, None
        
        # Allow some flexibility for document types
        if file_ext == '.docx' and 'zip' in detected_mime.lower():
            # DOCX is actually a ZIP file with XML inside
            return True, None
            
        return False, f"File content doesn't match extension. Expected {expected_mimes}, got {detected_mime}"
    except ImportError:
        # If python-magic is not available, skip MIME validation
        return True, None
    except Exception as e:
        return False, f"MIME validation error: {str(e)}"


def sanitize_filename(filename: str) -> Tuple[str, bool]:
    """
    Sanitize filename to prevent path traversal and other attacks.
    Returns (sanitized_filename, was_modified)
    """
    original = filename
    
    # Extract just the filename (no path)
    filename = os.path.basename(filename)
    
    # Remove dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        filename = re.sub(pattern, '_', filename)
    
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    filename = name + ext
    
    # Ensure it's not empty
    if not filename or filename == ext:
        filename = f"unnamed_file{ext}"
    
    was_modified = filename != original
    return filename, was_modified


def validate_file_extension(filename: str) -> Tuple[bool, Optional[str], str]:
    """
    Validate file extension is in allowed list.
    Returns (is_valid, error_message, extension)
    """
    ext = os.path.splitext(filename)[1].lower()
    allowed = list(ALLOWED_MIME_TYPES.keys())
    
    if ext not in allowed:
        return False, f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed)}", ext
    
    return True, None, ext


def full_file_validation(filename: str, content: bytes) -> Tuple[bool, Optional[str], str]:
    """
    Run all file validations.
    Returns (is_valid, error_message, sanitized_filename)
    """
    # Sanitize filename first
    safe_filename, was_modified = sanitize_filename(filename)
    
    # Validate extension
    is_valid, error, ext = validate_file_extension(safe_filename)
    if not is_valid:
        return False, error, safe_filename
    
    # Validate file size
    is_valid, error = validate_file_size(content)
    if not is_valid:
        return False, error, safe_filename
    
    # Validate MIME type
    is_valid, error = validate_mime_type(content, ext)
    if not is_valid:
        return False, error, safe_filename
    
    return True, None, safe_filename
