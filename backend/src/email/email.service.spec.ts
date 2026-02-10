import { EmailService } from './email.service';

describe('EmailService', () => {
    let service: EmailService;

    beforeEach(() => {
        // No RESEND_API_KEY set — runs in dev mode
        delete process.env.RESEND_API_KEY;
        service = new EmailService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateCode', () => {
        it('should generate a 6-digit code', () => {
            const code = service.generateCode();

            expect(code).toMatch(/^\d{6}$/);
        });

        it('should generate different codes', () => {
            const codes = new Set(Array.from({ length: 10 }, () => service.generateCode()));

            // With 10 codes, expect at least some uniqueness
            expect(codes.size).toBeGreaterThan(1);
        });
    });

    describe('sendVerificationEmail', () => {
        it('should succeed in dev mode (logs to console)', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await service.sendVerificationEmail('test@example.com', '123456', 'Test User');

            expect(result).toBe(true);
            consoleSpy.mockRestore();
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should succeed in dev mode (logs to console)', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await service.sendPasswordResetEmail('test@example.com', '654321');

            expect(result).toBe(true);
            consoleSpy.mockRestore();
        });
    });
});
