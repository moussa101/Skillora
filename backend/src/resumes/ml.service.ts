import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

export interface MlAnalysisResult {
  score: number;
  skills_found: string[];
  missing_keywords: string[];
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  education?: Array<{
    degree?: string;
    field?: string;
    institution?: string;
    year?: string;
  }>;
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
  feedback?: {
    summary?: string;
    suggestions?: string[];
  };
}

export interface BatchFileResult {
  filename: string;
  score: number;
  suspicious: boolean;
  suspicious_reason?: string;
  skills_found: string[];
  missing_keywords: string[];
  feedback?: { summary?: string; suggestions?: string[] };
  ats_score?: {
    overall_score: number;
    keyword_match_rate: number;
    critical_issues: string[];
    suggestions: string[];
  };
  error?: string;
}

export interface BatchAnalysisResult {
  total: number;
  successful: number;
  failed: number;
  results: BatchFileResult[];
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly mlServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  async analyzeResume(
    filePath: string,
    jobDescription: string,
  ): Promise<MlAnalysisResult> {
    try {
      this.logger.log(`Analyzing resume: ${filePath}`);

      const response = await firstValueFrom(
        this.httpService.post<MlAnalysisResult>(
          `${this.mlServiceUrl}/analyze`,
          {
            file_path: filePath,
            job_description: jobDescription,
          },
        ),
      );

      this.logger.log(`Analysis complete. Score: ${response.data.score}`);
      return response.data;
    } catch (error) {
      this.logger.error(`ML Service error: ${error.message}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlServiceUrl}/health`),
      );
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  async batchAnalyze(
    files: Express.Multer.File[],
    jobDescription: string,
  ): Promise<BatchAnalysisResult> {
    try {
      this.logger.log(`Batch analyzing ${files.length} resumes`);

      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }
      formData.append('job_description', jobDescription);

      const response = await firstValueFrom(
        this.httpService.post<BatchAnalysisResult>(
          `${this.mlServiceUrl}/batch-analyze`,
          formData,
          {
            headers: formData.getHeaders(),
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            timeout: 300000, // 5 min timeout for large batches
          },
        ),
      );

      this.logger.log(
        `Batch analysis complete: ${response.data.successful}/${response.data.total} successful`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Batch ML Service error: ${error.message}`);
      throw error;
    }
  }
}
