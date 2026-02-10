/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // HEALTH CHECK
  // ==========================================
  describe('Health', () => {
    it('GET /health should return ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET / should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  // ==========================================
  // AUTH ENDPOINTS
  // ==========================================
  describe('Auth', () => {
    describe('POST /auth/register', () => {
      it('should reject registration with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'not-an-email',
            password: 'Password123!',
            name: 'Test',
          })
          .expect(400);
      });

      it('should reject registration with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'test@example.com', password: '123', name: 'Test' })
          .expect(400);
      });

      it('should reject registration with missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'test@example.com' })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should reject login with missing credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(400);
      });

      it('should reject login with invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'WrongPass123!' })
          .expect(401);
      });
    });

    describe('GET /auth/me', () => {
      it('should reject unauthenticated request', () => {
        return request(app.getHttpServer()).get('/auth/me').expect(401);
      });

      it('should reject request with invalid token', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('POST /auth/verify-email', () => {
      it('should reject with missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({})
          .expect(400);
      });
    });

    describe('POST /auth/forgot-password', () => {
      it('should accept any email (does not reveal if user exists)', () => {
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'anyone@example.com' })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('POST /auth/reset-password', () => {
      it('should reject with missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({})
          .expect(400);
      });
    });

    describe('OAuth endpoints', () => {
      it('GET /auth/github should redirect to GitHub', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/github')
          .expect(302);

        expect(response.headers.location).toContain('github.com');
      });

      it('GET /auth/google should redirect to Google', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/google')
          .expect(302);

        expect(response.headers.location).toContain('accounts.google.com');
      });
    });
  });

  // ==========================================
  // PROTECTED ROUTES
  // ==========================================
  describe('Protected Routes', () => {
    it('GET /auth/usage should require auth', () => {
      return request(app.getHttpServer()).get('/auth/usage').expect(401);
    });

    it('POST /auth/profile-image should require auth', () => {
      return request(app.getHttpServer())
        .post('/auth/profile-image')
        .expect(401);
    });
  });
});
