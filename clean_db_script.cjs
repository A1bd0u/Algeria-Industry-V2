const fs = require('fs');

let content = fs.readFileSync('database_setup_full.sql', 'utf-8');

// Remove tenders table
content = content.replace(/CREATE TABLE public\.tenders \([\s\S]*?\);/g, '');
// Remove rfqs table
content = content.replace(/CREATE TABLE public\.rfqs \([\s\S]*?\);/g, '');

// Remove tenders alters and indexes
content = content.replace(/ALTER TABLE public\.tenders[\s\S]*?;/g, '');
content = content.replace(/CREATE INDEX IF NOT EXISTS idx_tenders_company_id ON public\.tenders\(company_id\);/g, '');
content = content.replace(/CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON public\.tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column\(\);/g, '');

// Remove vw_active_tenders
content = content.replace(/CREATE OR REPLACE VIEW public\.vw_active_tenders AS\s*SELECT[\s\S]*?FROM public\.tenders t[\s\S]*?;/g, '');

// Fix vw_company_stats
content = content.replace(/COUNT\(DISTINCT t\.id\) as total_tenders,/g, '');
content = content.replace(/LEFT JOIN public\.tenders t ON c\.id = t\.company_id/g, '');

// Remove seed data for tenders
content = content.replace(/INSERT INTO public\.tenders \([\s\S]*?;\n\n/g, '');
content = content.replace(/-- 3\. Seed Tenders[\s\S]*?(?=console\.log)/g, ''); // just in case it's JS, but here it's SQL
content = content.replace(/INSERT INTO public\.tenders[\s\S]*?;/g, '');

// Fix admin_dashboard_rpc
content = content.replace(/published_tenders INT;/g, '');
content = content.replace(/SELECT COUNT\(\*\) INTO published_tenders FROM public\.tenders WHERE status = 'published';/g, '');
content = content.replace(/'published_tenders', published_tenders,/g, '');

// Fix 'open' status for tenders in admin dashboard (if any)
content = content.replace(/SELECT COUNT\(\*\) INTO published_tenders FROM public\.tenders WHERE status = 'open';/g, '');

// Fix any trailing commas in JSON build objects
content = content.replace(/'active_products', active_products\s*,\s*'total_revenue'/g, "'active_products', active_products, 'total_revenue'");

fs.writeFileSync('database_setup_full.sql', content);
