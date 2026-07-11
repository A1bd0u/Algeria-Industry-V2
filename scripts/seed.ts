import { createClient } from '@supabase/supabase-js';
if (process.env.NODE_ENV === 'production') {
  console.error("❌ ERREUR CRITIQUE : L'exécution des seeds (données de test) est strictement interdite en production.");
  console.error("Ces scripts injectent des comptes administrateurs par défaut (ex: admin123) et des données factices qui compromettent la sécurité du système.");
  process.exit(1);
}

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Veuillez configurer SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans le fichier .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SECTORS = ['Agroalimentaire', 'BTPH', 'Chimie & Pétrochimie', 'Énergie & Mines', 'Industrie Pharmaceutique', 'Métallurgie & Mécanique', 'Plasturgie & Caoutchouc', 'Textile & Cuir', 'Électronique & Électroménager', 'Automobile & Transport', 'Énergies Renouvelables'];
const REGIONS = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Béjaïa', 'Ouargla', 'Blida', 'Tlemcen', 'Hassi Messaoud'];
const PDF_URLS = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://pdfobject.com/pdf/sample-3pp.pdf'
];

function cleanValue(val: string): any {
  val = val.trim();
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  // Unquoted values
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;
  if (val.toLowerCase() === 'null') return null;
  if (!isNaN(Number(val)) && val !== '') return Number(val);
  return val;
}

function parseSqlFile(filePath: string): { table: string; rows: any[] }[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const blocks = content.split(/INSERT\s+INTO\s+public\./gi);
  const results: { table: string; rows: any[] }[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;
    
    // Extract table name and columns
    const headerMatch = block.match(/^(\w+)\s*\(([^)]+)\)/i);
    if (!headerMatch) continue;
    
    const table = headerMatch[1].trim();
    const columns = headerMatch[2].split(',').map(c => c.trim().replace(/['"`]/g, ''));
    
    // Extract everything after VALUES
    const valuesIndex = block.toUpperCase().indexOf('VALUES');
    if (valuesIndex === -1) continue;
    
    const valuesPart = block.substring(valuesIndex + 6).trim();
    
    // Parse individual lines
    const valueLines = valuesPart
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('('));
    
    const rows: any[] = [];
    for (const line of valueLines) {
      // Remove leading '(' and trailing '),', ');', ')'
      let cleanLine = line;
      if (cleanLine.startsWith('(')) {
        cleanLine = cleanLine.substring(1);
      }
      if (cleanLine.endsWith(';')) {
        cleanLine = cleanLine.slice(0, -1);
      }
      if (cleanLine.endsWith(',')) {
        cleanLine = cleanLine.slice(0, -1);
      }
      if (cleanLine.endsWith(')')) {
        cleanLine = cleanLine.slice(0, -1);
      }
      
      // Parse columns respecting single quotes and commas
      const values: any[] = [];
      let currentVal = '';
      let inQuotes = false;
      
      for (let i = 0; i < cleanLine.length; i++) {
        const char = cleanLine[i];
        if (char === "'") {
          // Check for escaped single quote in SQL: ''
          if (cleanLine[i + 1] === "'") {
            currentVal += "'";
            i++; // Skip the next quote
          } else {
            inQuotes = !inQuotes;
            currentVal += char;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(cleanValue(currentVal));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(cleanValue(currentVal));
      
      const rowObj: any = {};
      columns.forEach((col, idx) => {
        rowObj[col] = values[idx];
      });
      rows.push(rowObj);
    }
    
    results.push({ table, rows });
  }
  
  return results;
}

async function runSqlSeeds() {
  console.log("Démarrage de l'importation des fichiers SQL de seed...");
  
  const seedFiles = [
    'supabase/seeds/20260705000002_seed_test_users.sql',
    'supabase/seeds/20260705000003_seed_data.sql'
  ];

  for (const file of seedFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARNING] Fichier de seed introuvable : ${filePath}`);
      continue;
    }
    
    console.log(`Lecture et traitement de ${file}...`);
    const blocks = parseSqlFile(filePath);
    
    for (const block of blocks) {
      console.log(`Upserting ${block.rows.length} lignes dans la table "${block.table}"...`);
      
      const chunkSize = 100;
      for (let i = 0; i < block.rows.length; i += chunkSize) {
        const chunk = block.rows.slice(i, i + chunkSize);
        
        let error;
        if (block.table === 'users') {
          const { error: upsertError } = await supabase
            .from(block.table)
            .upsert(chunk, { onConflict: 'email' });
          error = upsertError;
        } else {
          const { error: upsertError } = await supabase
            .from(block.table)
            .upsert(chunk);
          error = upsertError;
        }
        
        if (error) {
          console.error(`Erreur d'upsert pour la table ${block.table}:`, error.message);
          process.exit(1);
        }
      }
      console.log(`Table "${block.table}" upsertée avec succès.`);
    }
  }
  console.log("Importation des fichiers SQL de seed terminée avec succès !");
}

async function seed() {
  console.log("Démarrage du script de seed (programmé, sans données démo de test)...");

  // 1. Seed Companies (60)
  console.log("Insertion des entreprises...");
  const companies = [];
  for (let i = 1; i <= 60; i++) {
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const isPublic = Math.random() > 0.8;
    companies.push({
      reference_id: `CMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: `Entreprise ${sector} ${region} ${isPublic ? 'SPA' : 'SARL'}`,
      nif: `0000${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      rc: `16/00-${Math.floor(1000000 + Math.random() * 9000000)}B${Math.floor(10 + Math.random() * 10)}`,
      description: `Leader dans le domaine ${sector}, spécialisé dans les solutions industrielles de pointe et l'innovation continue. Basé à ${region}.`,
      activity_sector: sector,
      region: region,
      certified: Math.random() > 0.5,
      status: 'approved'
    });
  }

  const { data: insertedCompanies, error: companiesError } = await supabase
    .from('companies')
    .insert(companies)
    .select();

  if (companiesError) {
    console.error("Erreur lors de l'insertion des entreprises:", companiesError);
    return;
  }

  console.log(`${insertedCompanies.length} entreprises insérées.`);

  // 2. Upload PDFs & Seed Catalogues
  console.log("Génération des catalogues et upload (simulation ou réel)...");
  
  let uploadedPdfUrls: string[] = [];
  try {
    const pdfResponse = await fetch(PDF_URLS[0]);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('catalogues')
      .upload(`seed/sample_catalogue_${Date.now()}.pdf`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.warn("Impossible d'uploader dans Supabase Storage (le bucket 'catalogues' existe-t-il ?). Utilisation d'URLs publiques.");
      uploadedPdfUrls = PDF_URLS;
    } else {
      const { data: { publicUrl } } = supabase.storage.from('catalogues').getPublicUrl(uploadData.path);
      uploadedPdfUrls = [publicUrl];
      console.log("PDF uploadé avec succès :", publicUrl);
    }
  } catch(e: any) {
      console.warn("Erreur fetch/upload, fallback sur URL externe.", e.message);
      uploadedPdfUrls = PDF_URLS;
  }

  const catalogues = [];
  for (let i = 0; i < 40; i++) {
    const company = insertedCompanies[Math.floor(Math.random() * insertedCompanies.length)];
    catalogues.push({
      title: `Catalogue Général ${company.activity_sector} - 2026`,
      description: `Découvrez nos dernières gammes de produits et services pour le secteur ${company.activity_sector}.`,
      pdf_url: uploadedPdfUrls[Math.floor(Math.random() * uploadedPdfUrls.length)],
      company_id: company.id
    });
  }

  const { error: cataloguesError } = await supabase.from('catalogues').insert(catalogues);
  if (cataloguesError) console.error("Erreur catalogues:", cataloguesError);
  else console.log(`${catalogues.length} catalogues insérés.`);

  // 3. Seed Tenders (Appels d'offres publics)
  console.log("Insertion des appels d'offres...");
  const tenders = [];
  const tenderTypes = ['Fourniture de', 'Installation de', 'Maintenance de', 'Construction de', 'Étude et réalisation pour'];
  
  for (let i = 0; i < 50; i++) {
    const company = insertedCompanies[Math.floor(Math.random() * insertedCompanies.length)];
    const type = tenderTypes[Math.floor(Math.random() * tenderTypes.length)];
    const sector = company.activity_sector;
    tenders.push({
      title: `Appel d'offre national: ${type} équipement industriel (${sector})`,
      description: `Le groupe ${company.name} lance un appel d'offres ouvert pour la ${type.toLowerCase()} dans nos nouvelles installations de la région ${company.region}. Le cahier des charges peut être retiré auprès de notre direction.`,
      company_id: company.id,
      deadline: new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 90).toISOString(),
      reference_id: `AO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}/DG`,
      status: 'open'
    });
  }

  const { error: tendersError } = await supabase.from('tenders').insert(tenders);
  if (tendersError) console.error("Erreur appels d'offres:", tendersError);
  else console.log(`${tenders.length} appels d'offres insérés.`);

  console.log("Seed terminé avec succès !");
}

async function main() {
  const isDemo = process.argv.includes('--demo') || process.argv.includes('--with-demo');
  if (isDemo) {
    await runSqlSeeds();
  } else {
    await seed();
  }
}

main().catch(console.error);
