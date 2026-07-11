import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';

describe('Auth Routes Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  describe('POST /api/auth/register', () => {
    it('devrait rejeter un mot de passe faible', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak', // weak password (min 8, letter, number)
          captchaToken: 'dummy-token'
        });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
      expect(JSON.stringify(res.body.details)).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('devrait rejeter un email invalide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'StrongPassword123',
          captchaToken: 'dummy-token'
        });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
      expect(JSON.stringify(res.body.details)).toContain('Email invalide');
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait rejeter une requête sans captcha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPassword123'
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.details)).toContain('Captcha requis');
    });
  });
});
