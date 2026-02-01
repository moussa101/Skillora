# Test Data for AI Resume Analyzer

This folder contains sample resumes and job descriptions for testing the AI Resume Analyzer.

## Contents

### Resumes (`/resumes`)
| File | Type | Description |
|------|------|-------------|
| `software_engineer_resume.txt/.pdf/.docx` | Senior-level | Full stack engineer with 5+ years experience, Python, JavaScript, AWS, ML |
| `data_scientist_resume.txt/.pdf/.docx` | Mid-level | Data scientist with ML, NLP, TensorFlow, PyTorch experience |
| `junior_developer_resume.txt/.pdf/.docx` | Entry-level | Recent graduate with React, Node.js, basic project experience |

### Job Descriptions (`/job_descriptions`)
| File | Type | Description |
|------|------|-------------|
| `senior_software_engineer_jd.txt/.pdf/.docx` | Senior Engineer | Full stack role requiring React, Node.js, AWS, Docker, 5+ years |
| `data_scientist_jd.txt/.pdf/.docx` | Data Scientist | ML role requiring Python, TensorFlow, NLP, spaCy, 3+ years |
| `junior_developer_jd.txt/.pdf/.docx` | Junior Developer | Entry-level role for React, JavaScript, 0-2 years |

## Usage

1. Upload any resume file to the analyzer
2. Paste the corresponding job description (or any job description)
3. Click "Analyze Resume" to see the match score and suggestions

## Test Scenarios

### High Match (Expected: 85-100%)
- `software_engineer_resume` + `senior_software_engineer_jd`
- `data_scientist_resume` + `data_scientist_jd`
- `junior_developer_resume` + `junior_developer_jd`

### Medium Match (Expected: 50-75%)
- `software_engineer_resume` + `data_scientist_jd`
- `data_scientist_resume` + `senior_software_engineer_jd`

### Low Match (Expected: 20-40%)
- `junior_developer_resume` + `senior_software_engineer_jd`
- `junior_developer_resume` + `data_scientist_jd`

## File Formats

Each document is available in 3 formats:
- `.txt` - Plain text
- `.pdf` - PDF document
- `.docx` - Microsoft Word document

Total: 18 files (6 base documents × 3 formats)
