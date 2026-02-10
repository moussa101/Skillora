import { Test, TestingModule } from '@nestjs/testing';
import { ResumesService } from './resumes.service';
import { PrismaService } from '../prisma.service';

describe('ResumesService', () => {
  let service: ResumesService;

  const mockPrisma = {
    resume: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    analysis: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ResumesService>(ResumesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a resume', async () => {
      const resumeData = {
        filePath: '/uploads/resume.pdf',
        fileName: 'resume.pdf',
        fileSize: 1024,
        user: { connect: { id: 1 } },
      };
      const createdResume = { id: 1, ...resumeData, userId: 1 };
      mockPrisma.resume.create.mockResolvedValue(createdResume);

      const result = await service.create(resumeData);

      expect(result.id).toBe(1);
      expect(mockPrisma.resume.create).toHaveBeenCalledWith({
        data: resumeData,
      });
    });
  });

  describe('findAll', () => {
    it('should return all resumes for a user ordered by date desc', async () => {
      const resumes = [
        { id: 2, userId: 1, fileName: 'resume2.pdf', analyses: [] },
        { id: 1, userId: 1, fileName: 'resume1.pdf', analyses: [] },
      ];
      mockPrisma.resume.findMany.mockResolvedValue(resumes);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        include: { analyses: true },
      });
    });

    it('should return empty array for user with no resumes', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);

      const result = await service.findAll(999);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should find a resume by id with userId check', async () => {
      const resume = { id: 1, userId: 1, fileName: 'resume.pdf', analyses: [] };
      mockPrisma.resume.findFirst.mockResolvedValue(resume);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(resume);
      expect(mockPrisma.resume.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        include: { analyses: true },
      });
    });

    it('should find a resume by id without userId', async () => {
      const resume = { id: 1, userId: 1, fileName: 'resume.pdf', analyses: [] };
      mockPrisma.resume.findUnique.mockResolvedValue(resume);

      const result = await service.findOne(1);

      expect(result).toEqual(resume);
      expect(mockPrisma.resume.findUnique).toHaveBeenCalled();
    });

    it('should return null if resume not found', async () => {
      mockPrisma.resume.findFirst.mockResolvedValue(null);

      const result = await service.findOne(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('createAnalysis', () => {
    it('should create an analysis', async () => {
      const analysisData = {
        jobDescText: 'Looking for a senior developer',
        matchScore: 85.5,
        skillsFound: ['Python', 'Docker'],
        missingSkills: ['Kubernetes'],
        resume: { connect: { id: 1 } },
      };
      const createdAnalysis = { id: 1, resumeId: 1, ...analysisData };
      mockPrisma.analysis.create.mockResolvedValue(createdAnalysis);

      const result = await service.createAnalysis(analysisData);

      expect(result.matchScore).toBe(85.5);
    });
  });
});
