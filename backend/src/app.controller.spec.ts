import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let controller: AppController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        controller = module.get<AppController>(AppController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getHello', () => {
        it('should return "Hello World!"', () => {
            expect(controller.getHello()).toBe('Hello World!');
        });
    });

    describe('getHealth', () => {
        it('should return status ok with timestamp', () => {
            const result = controller.getHealth();

            expect(result.status).toBe('ok');
            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp).getTime()).not.toBeNaN();
        });
    });
});
