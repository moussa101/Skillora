"""
AI Resume Analyzer - ML Service
FastAPI application for resume parsing and analysis
With Adversarial Defense (SRS v1.1)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

# Security imports
try:
    from security.scanner import ResumeSecurityScanner, wrap_for_llm
except ImportError:
    # Fallback for when security module not yet available
    ResumeSecurityScanner = None
    wrap_for_llm = lambda x: x

# ML Analyzer import
try:
    from analyzer import get_analyzer
    ANALYZER_AVAILABLE = True
except ImportError:
    ANALYZER_AVAILABLE = False
    get_analyzer = None


app = FastAPI(
    title="AI Resume Analyzer - ML Service",
    description="ML service for resume parsing, NER extraction, and semantic similarity scoring with adversarial defense",
    version="1.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class AnalyzeRequest(BaseModel):
    file_path: Optional[str] = None
    resume_text: Optional[str] = None  # Can pass text directly instead of file
    job_description: str


class SecurityInfo(BaseModel):
    is_safe: bool
    flags: List[str] = []
    invisible_text_detected: bool = False
    homoglyphs_detected: bool = False
    metadata_mismatch: bool = False


class AnalyzeResponse(BaseModel):
    score: float
    suspicious: bool = False  # NFR-SEC-04: Flag high scores
    suspicious_reason: Optional[str] = None
    security: Optional[SecurityInfo] = None
    skills_found: List[str]
    missing_keywords: List[str]
    contact_info: Optional[dict] = None
    education: Optional[List[dict]] = None
    experience: Optional[List[dict]] = None
    feedback: Optional[dict] = None


class HealthResponse(BaseModel):
    status: str
    version: str


class SecurityScanResponse(BaseModel):
    is_safe: bool
    security_flags: List[str]
    details: Dict[str, Any]


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", version="1.1.0")


# Security scan endpoint
@app.post("/security-scan", response_model=SecurityScanResponse)
async def security_scan(file_path: str):
    """
    FR-SEC-01 to FR-SEC-05: Security scan for adversarial attacks
    """
    if ResumeSecurityScanner is None:
        raise HTTPException(status_code=500, detail="Security scanner not available")
    
    scanner = ResumeSecurityScanner()
    result = scanner.scan_pdf(file_path)
    
    return SecurityScanResponse(
        is_safe=result.get("is_safe", False),
        security_flags=result.get("security_flags", []),
        details=result
    )


# Main analysis endpoint
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    """
    Analyze a resume against a job description.
    Accepts either file_path or resume_text directly.
    """
    
    # Determine resume text source
    resume_text = request.resume_text
    file_exists = request.file_path and os.path.exists(request.file_path)
    
    # Run security scan if file exists
    security_info = None
    if ResumeSecurityScanner is not None and file_exists:
        scanner = ResumeSecurityScanner()
        scan_result = scanner.scan_pdf(request.file_path)
        security_info = SecurityInfo(
            is_safe=scan_result.get("is_safe", True),
            flags=scan_result.get("security_flags", []),
            invisible_text_detected=scan_result.get("invisible_text_detected", False),
            homoglyphs_detected=scan_result.get("homoglyphs_detected", False),
            metadata_mismatch=scan_result.get("metadata_mismatch", False),
        )
    
    # Use real analyzer if available
    if ANALYZER_AVAILABLE and get_analyzer is not None:
        analyzer = get_analyzer()
        
        if resume_text:
            # Direct text analysis
            skills_found = analyzer.extract_skills(resume_text)
            score = analyzer.calculate_semantic_similarity(resume_text, request.job_description)
            missing_keywords = analyzer.find_missing_keywords(resume_text, request.job_description)
            feedback = analyzer._generate_feedback(score, skills_found, missing_keywords)
        elif file_exists:
            # File-based analysis
            result = analyzer.analyze(request.file_path, request.job_description)
            score = result["score"]
            skills_found = result["skills_found"]
            missing_keywords = result["missing_keywords"]
            feedback = result["feedback"]
        else:
            # No valid input
            score = 0.0
            skills_found = []
            missing_keywords = []
            feedback = {
                "summary": "No resume text or valid file provided",
                "suggestions": ["Upload a resume file or paste resume text"]
            }
    else:
        # Fallback when analyzer not available
        score = 50.0
        skills_found = ["Analyzer not available"]
        missing_keywords = []
        feedback = {
            "summary": "Analysis requires sentence-transformers",
            "suggestions": ["Run: pip install sentence-transformers"]
        }
    
    # NFR-SEC-04: Anomaly Detection - flag suspiciously high scores
    suspicious = False
    suspicious_reason = None
    if score >= 95.0:
        suspicious = True
        suspicious_reason = "Score >= 95% indicates possible JD copy-paste. Manual review required."
    
    return AnalyzeResponse(
        score=round(score, 1),
        suspicious=suspicious,
        suspicious_reason=suspicious_reason,
        security=security_info,
        skills_found=skills_found[:10],
        missing_keywords=missing_keywords[:8],
        feedback=feedback
    )


# Text extraction endpoint
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded resume file.
    Supports PDF, DOCX, and TXT formats.
    """
    
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        content = await file.read()
        text = ""
        
        if file_ext == '.pdf':
            # Use PyMuPDF for PDF extraction
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
        
        elif file_ext == '.docx':
            # Use python-docx for DOCX extraction
            import docx
            from io import BytesIO
            doc = docx.Document(BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        
        elif file_ext == '.txt':
            text = content.decode('utf-8')
        
        return {
            "filename": file.filename,
            "text": text,
            "length": len(text),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


# File upload + analyze endpoint (combines upload and analysis)
@app.post("/analyze-file", response_model=AnalyzeResponse)
async def analyze_file(file: UploadFile = File(...), job_description: str = Form(...)):
    """
    Upload a resume file and analyze it against a job description.
    Extracts text from PDF/DOCX/TXT and performs analysis.
    """
    
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        content = await file.read()
        text = ""
        
        if file_ext == '.pdf':
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
        
        elif file_ext == '.docx':
            import docx
            from io import BytesIO
            doc = docx.Document(BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        
        elif file_ext == '.txt':
            text = content.decode('utf-8')
        
        if not text or len(text) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Now analyze using the extracted text
        if ANALYZER_AVAILABLE and get_analyzer is not None:
            analyzer = get_analyzer()
            skills_found = analyzer.extract_skills(text)
            score = analyzer.calculate_semantic_similarity(text, job_description)
            missing_keywords = analyzer.find_missing_keywords(text, job_description)
            feedback = analyzer._generate_feedback(score, skills_found, missing_keywords)
        else:
            score = 50.0
            skills_found = ["Analyzer not available"]
            missing_keywords = []
            feedback = {"summary": "Install dependencies", "suggestions": []}
        
        # Anomaly detection
        suspicious = score >= 95.0
        suspicious_reason = "Score >= 95% indicates possible JD copy-paste." if suspicious else None
        
        return AnalyzeResponse(
            score=round(score, 1),
            suspicious=suspicious,
            suspicious_reason=suspicious_reason,
            security=None,
            skills_found=skills_found[:10],
            missing_keywords=missing_keywords[:8],
            feedback=feedback
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


