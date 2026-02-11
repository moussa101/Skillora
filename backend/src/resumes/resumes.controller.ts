import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  Get,
  Param,
  ParseIntPipe,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { AuthService } from '../auth/auth.service';
import { multerOptions } from './multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MlService } from './ml.service';
import * as multer from 'multer';

@ApiTags('resumes')
@ApiBearerAuth()
@Controller('resumes')
@UseGuards(AuthGuard('jwt'))
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly mlService: MlService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload a resume file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const resume = await this.resumesService.create({
      filePath: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      user: { connect: { id: req.user.id } },
    });

    return {
      message: 'File uploaded successfully',
      resume,
    };
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze a resume against a job description' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jobDescription: { type: 'string', description: 'Job description text' },
      },
      required: ['jobDescription'],
    },
  })
  async analyzeResume(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { jobDescription: string },
    @Request() req,
  ) {
    // 1. Verify ownership
    const resume = await this.resumesService.findOne(id, req.user.id);
    if (!resume) {
      return { error: 'Resume not found' };
    }

    // 2. Check usage limits
    const usage = await this.authService.checkAndIncrementUsage(req.user.id);
    if (!usage.allowed) {
      return {
        error: 'Monthly analysis limit reached. Upgrade to Pro for more.',
        limitReached: true,
      };
    }

    const analysis = await this.mlService.analyzeResume(
      resume.filePath,
      body.jobDescription,
    );

    // Save analysis to DB
    const savedAnalysis = await this.resumesService.createAnalysis({
      matchScore: analysis.score,
      skillsFound: analysis.skills_found,
      missingSkills: analysis.missing_keywords,
      jobDescText: body.jobDescription,
      feedback: analysis.feedback,
      resume: { connect: { id } },
    });

    // Get updated remaining count
    const remaining = usage.remaining;

    return {
      analysis: savedAnalysis,
      details: analysis,
      usage: {
        remaining,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for the current user' })
  async findAll(@Request() req) {
    return this.resumesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific resume' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Verify ownership
    return this.resumesService.findOne(id, req.user.id);
  }

  @Post('analyze-file')
  @ApiOperation({ summary: 'Upload and analyze a resume file directly' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        job_description: { type: 'string' },
      },
      required: ['file', 'job_description'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async analyzeFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { job_description: string },
    @Request() req,
  ) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }
    if (!body.job_description || body.job_description.trim().length < 10) {
      throw new HttpException(
        'Job description must be at least 10 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check usage limits
    const usage = await this.authService.checkAndIncrementUsage(req.user.id);
    if (!usage.allowed) {
      throw new HttpException(
        'Monthly analysis limit reached. Upgrade to Pro for more.',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const result = await this.mlService.analyzeFile(file, body.job_description);
      return { ...result, usage: { remaining: usage.remaining } };
    } catch (error) {
      throw new HttpException(
        `Analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch-analyze')
  @ApiOperation({ summary: 'Batch analyze multiple resumes (Recruiter only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async batchAnalyze(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { jobDescription: string },
    @Request() req,
  ) {
    // Check recruiter role/tier
    if (
      req.user.role !== 'RECRUITER' &&
      req.user.tier !== 'RECRUITER' &&
      req.user.role !== 'ADMIN'
    ) {
      throw new HttpException(
        'Batch analysis is only available for Recruiter accounts',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!files || files.length === 0) {
      throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
    }

    if (!body.jobDescription || body.jobDescription.trim().length < 10) {
      throw new HttpException(
        'Job description must be at least 10 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check usage limits for each file in the batch
    const usage = await this.authService.checkAndIncrementUsage(req.user.id);
    if (!usage.allowed) {
      throw new HttpException(
        'Monthly analysis limit reached.',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const result = await this.mlService.batchAnalyze(
        files,
        body.jobDescription,
      );
      return { ...result, usage: { remaining: usage.remaining } };
    } catch (error) {
      throw new HttpException(
        `Batch analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
