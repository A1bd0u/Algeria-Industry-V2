import { productCategories } from '../data/productCategories';

// Import de produits en masse : lecture d'un fichier CSV (ou des lignes d'une
// feuille Excel), reconnaissance des colonnes et contrôle de chaque ligne.
// Fonctions pures, partagées par le navigateur (aperçu) et le serveur
// (contrôle final), pour que les deux appliquent exactement les mêmes règles.

export const MAX_IMPORT_ROWS = 200;

export type ImportField = 'name' | 'category' | 'price' | 'description';

export type ImportRow = { name: string; category: string | null; price: number | null; description: string };

export type RowIssue = { row: number; field: ImportField; code: ImportIssueCode };

export type ImportIssueCode = 'NAME_REQUIRED' | 'NAME_TOO_LONG' | 'CATEGORY_UNKNOWN' | 'PRICE_INVALID' | 'DESCRIPTION_TOO_LONG';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim();

// En-têtes acceptés (français, anglais, arabe), sans tenir compte des accents
// ni de la casse.
const HEADER_ALIASES: Record<ImportField, string[]> = {
  name: ['nom', 'nom du produit', 'produit', 'designation', 'name', 'product', 'product name', 'الاسم', 'اسم المنتج', 'المنتج'],
  category: ['categorie', 'sous categorie', 'code categorie', 'category', 'subcategory', 'الفئة', 'الصنف'],
  price: ['prix', 'prix da', 'prix dzd', 'prix ttc', 'price', 'price dzd', 'السعر'],
  description: ['description', 'descriptif', 'details', 'الوصف'],
};

export const mapHeaders = (headers: unknown[]): Partial<Record<ImportField, number>> => {
  const mapping: Partial<Record<ImportField, number>> = {};
  headers.forEach((header, index) => {
    const key = normalize(String(header ?? ''));
    (Object.keys(HEADER_ALIASES) as ImportField[]).forEach((field) => {
      if (mapping[field] === undefined && HEADER_ALIASES[field].some((alias) => normalize(alias) === key)) {
        mapping[field] = index;
      }
    });
  });
  return mapping;
};

// Sous-catégorie à partir d'un code (« B1 ») ou d'un libellé, complet ou
// abrégé (« Machines-outils »). Renvoie le libellé stocké en base, ou null.
const SUBCATEGORIES = productCategories.flatMap((group) => group.subCategories);

export const resolveCategory = (input: string): string | null => {
  const raw = input.trim();
  if (!raw) return null;
  const byCode = SUBCATEGORIES.find((sub) => sub.id.toLowerCase() === raw.toLowerCase());
  if (byCode) return byCode.name;
  const key = normalize(raw);
  const exact = SUBCATEGORIES.find((sub) => normalize(sub.name) === key);
  if (exact) return exact.name;
  const short = SUBCATEGORIES.find((sub) => normalize(sub.name.split(/[:(]/)[0]) === key);
  return short ? short.name : null;
};

// Prix : « 1 850 000 », « 1850000 DA », « 1.850.000,50 » ; vide = sur devis.
export const parsePrice = (value: unknown): number | null | 'invalid' => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : 'invalid';
  let text = String(value).replace(/\s| | /g, '').replace(/(da|dzd|دج)$/i, '');
  if (!text || /^(sur devis|surdevis|devis|on request|-)$/i.test(text)) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, '').replace(',', '.');
  else text = text.replace(',', '.');
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : 'invalid';
};

// Contrôle d'une ligne déjà découpée en champs. Le numéro de ligne est celui
// du fichier (en-tête = ligne 1) pour que le fournisseur la retrouve.
export const validateRow = (fields: Partial<Record<ImportField, unknown>>, rowNumber: number) => {
  const issues: RowIssue[] = [];
  const name = String(fields.name ?? '').trim();
  if (name.length < 2) issues.push({ row: rowNumber, field: 'name', code: 'NAME_REQUIRED' });
  else if (name.length > 200) issues.push({ row: rowNumber, field: 'name', code: 'NAME_TOO_LONG' });

  const categoryInput = String(fields.category ?? '').trim();
  const category = categoryInput ? resolveCategory(categoryInput) : null;
  if (categoryInput && !category) issues.push({ row: rowNumber, field: 'category', code: 'CATEGORY_UNKNOWN' });

  const price = parsePrice(fields.price);
  if (price === 'invalid') issues.push({ row: rowNumber, field: 'price', code: 'PRICE_INVALID' });

  const description = String(fields.description ?? '').trim();
  if (description.length > 10000) issues.push({ row: rowNumber, field: 'description', code: 'DESCRIPTION_TOO_LONG' });

  const row: ImportRow = { name, category, price: price === 'invalid' ? null : price, description };
  return { row, issues };
};

// Tableau de lignes (CSV ou Excel) -> lignes contrôlées. La première ligne
// non vide est l'en-tête ; les lignes entièrement vides sont ignorées.
export const rowsFromTable = (table: unknown[][]) => {
  const nonEmpty = table
    .map((cells, index) => ({ cells, line: index + 1 }))
    .filter(({ cells }) => cells.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmpty.length === 0) return { error: 'EMPTY_FILE' as const };
  const [header, ...body] = nonEmpty;
  const mapping = mapHeaders(header.cells);
  if (mapping.name === undefined) return { error: 'NAME_COLUMN_MISSING' as const };
  if (body.length > MAX_IMPORT_ROWS) return { error: 'TOO_MANY_ROWS' as const };
  const pick = (cells: unknown[], field: ImportField) => (mapping[field] === undefined ? undefined : cells[mapping[field]!]);
  const results = body.map(({ cells, line }) =>
    ({ line, ...validateRow({ name: pick(cells, 'name'), category: pick(cells, 'category'), price: pick(cells, 'price'), description: pick(cells, 'description') }, line) }));
  return { results, mapping };
};

// Lecture CSV (RFC 4180) : guillemets, retours à la ligne dans un champ,
// séparateur « ; » (Excel français) ou « , » détecté sur l'en-tête.
export const parseCsv = (input: string): string[][] => {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length && firstLine.includes(';') ? ';'
    : firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
};

// Modèle téléchargeable : séparateur « ; » et BOM UTF-8 pour qu'Excel
// l'ouvre correctement (accents, arabe).
export const templateCsv = () => {
  const lines = [
    ['nom', 'categorie', 'prix', 'description'],
    ['Pompe centrifuge inox 15 kW', 'B2', '185000', 'Corps inox 316L, débit 60 m3/h, garantie 2 ans.'],
    ['Gants de protection nitrile (carton de 100)', 'E3', '', 'Prix sur devis selon quantité.'],
  ];
  const escape = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return '﻿' + lines.map((l) => l.map(escape).join(';')).join('\r\n') + '\r\n';
};
