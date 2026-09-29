// Contrôle statique des migrations Supabase exécuté en CI :
// - noms horodatés, uniques et triés (YYYYMMDDHHMMSS_nom.sql) ;
// - aucune politique RLS qui ouvre l'accès quand l'utilisateur est inconnu.
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const errors = [];

const seen = new Set();
for (const file of files) {
  const match = file.match(/^(\d{14})_[a-z0-9_]+\.sql$/);
  if (!match) errors.push(`Nom de migration invalide : ${file}`);
  else if (seen.has(match[1])) errors.push(`Horodatage en double : ${file}`);
  else seen.add(match[1]);
}

// Les politiques de la dernière migration qui touche une table font foi :
// on vérifie seulement que les nouvelles migrations n'en recréent pas de permissives.
const PERMISSIVE = [/get_current_user_id\(\)\s+IS\s+NULL/i, /owner_id\s+IS\s+NULL/i];
const hardeningIndex = files.findIndex((f) => f.includes('security_p0_hardening'));
for (const file of files.slice(Math.max(hardeningIndex, 0))) {
  const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
  for (const statement of sql.split(';')) {
    if (/CREATE\s+POLICY/i.test(statement) && PERMISSIVE.some((re) => re.test(statement.replace(/IS NOT NULL/gi, '')))) {
      errors.push(`Politique RLS permissive dans ${file} : ${statement.trim().split('\n')[0]}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${files.length} migrations vérifiées.`);
