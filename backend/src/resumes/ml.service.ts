import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class MlService {
    private readonly logger = new Logger(MlService.name);
    private readonly mlServiceUrl: string;

    constructor(private readonly httpService: HttpService) {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    }

    async analyzeResume(filePath: string, jobDescription: string): Promise<MlAnalysisResult> {
        try {
            this.logger.log(`Analyzing resume: ${filePath}`);

            const response = await firstValueFrom(
                this.httpService.post<MlAnalysisResult>(`${this.mlServiceUrl}/analyze`, {
                    file_path: filePath,
                    job_description: jobDescription,
                })
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
                this.httpService.get(`${this.mlServiceUrl}/health`)
            );
            return response.data.status === 'healthy';
        } catch {
            return false;
        }
    }
}
