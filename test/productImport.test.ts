import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';
import { mapHeaders, parseCsv, parsePrice, resolveCategory, rowsFromTable, templateCsv } from '../src/lib/productImport';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

describe('Lecture des fichiers d\'import', () => {
  it('lit un CSV « ; » d\'Excel avec BOM, guillemets et retour à la ligne', () => {
    const rows = parseCsv('﻿nom;prix;description\r\n"Pompe; inox";"1 850 000";"Ligne 1\nLigne 2"\r\n');
    expect(rows[0]).toEqual(['nom', 'prix', 'description']);
    expect(rows[1]).toEqual(['Pompe; inox', '1 850 000', 'Ligne 1\nLigne 2']);
  });

  it('lit un CSV à virgules', () => {
    expect(parseCsv('name,price\nValve,"1,5"\n')).toEqual([['name', 'price'], ['Valve', '1,5']]);
  });

  it('reconnaît les en-têtes en français, anglais et arabe', () => {
    expect(mapHeaders(['Nom du produit', 'Catégorie', 'Prix (DA)', 'Description'])).toEqual({ name: 0, category: 1, price: 2, description: 3 });
    expect(mapHeaders(['Product', 'Category', 'Price'])).toEqual({ name: 0, category: 1, price: 2 });
    expect(mapHeaders(['الاسم', 'الفئة', 'السعر'])).toEqual({ name: 0, category: 1, price: 2 });
  });

  it('résout la catégorie par code ou par libellé', () => {
    expect(resolveCategory('b1')).toBe('Machines-outils : Tours, fraiseuses, presses.');
    expect(resolveCategory('Machines-outils')).toBe('Machines-outils : Tours, fraiseuses, presses.');
    expect(resolveCategory('metaux')).toBe('Métaux (acier, aluminium, cuivre, etc.)');
    expect(resolveCategory('Fusées')).toBeNull();
  });

  it('lit les prix courants et « sur devis »', () => {
    expect(parsePrice('1 850 000 DA')).toBe(1850000);
    expect(parsePrice('1.850.000,50')).toBe(1850000.5);
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('Sur devis')).toBeNull();
    expect(parsePrice(12.5)).toBe(12.5);
    expect(parsePrice('-3')).toBe('invalid');
    expect(parsePrice('abc')).toBe('invalid');
  });

  it('signale chaque ligne fautive avec son numéro dans le fichier', () => {
    const result = rowsFromTable([['nom', 'categorie', 'prix'], ['Pompe', 'B2', '100'], [], ['X', 'Z9', 'abc']]);
    if ('error' in result) throw new Error('unexpected');
    expect(result.results[0].issues).toEqual([]);
    expect(result.results[1].line).toBe(4);
    expect(result.results[1].issues.map((i) => i.code)).toEqual(['NAME_REQUIRED', 'CATEGORY_UNKNOWN', 'PRICE_INVALID']);
  });

  it('refuse un fichier sans colonne « nom »', () => {
    expect(rowsFromTable([['prix'], ['10']])).toEqual({ error: 'NAME_COLUMN_MISSING' });
    expect(rowsFromTable([])).toEqual({ error: 'EMPTY_FILE' });
  });

  it('fournit un modèle relisible', () => {
    const result = rowsFromTable(parseCsv(templateCsv()));
    if ('error' in result) throw new Error('unexpected');
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.issues.length === 0)).toBe(true);
  });
});

describe('POST /api/products/import', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  const setup = (plan: string, existing: number, products?: Handler) => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: (q) => (q.columns?.includes('plan_ends_at') ? { data: { plan, plan_ends_at: null } } : undefined),
      products: products || ((q) => (q.op === 'select' ? { count: existing } : { data: q.payload.map((_: any, i: number) => ({ id: `p${i}` })) })),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    return mock;
  };

  it('crée les produits en brouillon', async () => {
    const mock = setup('pro', 0);
    const res = await request(app).post('/api/products/import').set('Cookie', ['token=t']).send({ rows: [
      { line: 2, name: 'Pompe centrifuge', category: 'B2', price: '185 000', description: 'Inox' },
      { line: 3, name: 'Gants nitrile', category: '', price: '' },
    ] });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(2);
    const insert = mock.queries.find((q) => q.table === 'products' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ name: 'Pompe centrifuge', price: 185000, status: 'Brouillon', owner_id: '11111111-1111-4111-8111-111111111111' });
    expect(insert?.payload[1]).toMatchObject({ category: 'Non catégorisé', price: null });
    expect(insert?.payload[0].category).toContain('Équipements de production');
  });

  it('ne crée rien si une ligne est invalide', async () => {
    const mock = setup('pro', 0);
    const res = await request(app).post('/api/products/import').set('Cookie', ['token=t']).send({ rows: [
      { line: 2, name: 'Pompe', price: '10' },
      { line: 3, name: 'Vanne', price: 'gratuit' },
    ] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('IMPORT_INVALID_ROWS');
    expect(res.body.issues).toEqual([{ row: 3, field: 'price', code: 'PRICE_INVALID' }]);
    expect(mock.queries.some((q) => q.table === 'products' && q.op === 'insert')).toBe(false);
  });

  it('respecte la limite de l\'offre', async () => {
    const mock = setup('free', 4);
    const res = await request(app).post('/api/products/import').set('Cookie', ['token=t']).send({ rows: [{ name: 'A1 test' }, { name: 'A2 test' }] });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'IMPORT_PLAN_LIMIT', limit: 5, remaining: 1 });
    expect(mock.queries.some((q) => q.table === 'products' && q.op === 'insert')).toBe(false);
  });

  it('exige un KYC approuvé et refuse plus de 200 lignes', async () => {
    const pending = createSupabaseMock({ users: usersHandler(sessionRow({ kyc_status: 'pending' })) });
    vi.mocked(getSupabase).mockReturnValue(pending.client as any);
    expect((await request(app).post('/api/products/import').set('Cookie', ['token=t']).send({ rows: [{ name: 'Pompe' }] })).status).toBe(403);

    setup('pro', 0);
    const many = Array.from({ length: 201 }, (_, i) => ({ name: `Produit ${i}` }));
    expect((await request(app).post('/api/products/import').set('Cookie', ['token=t']).send({ rows: many })).status).toBe(400);
  });
});
