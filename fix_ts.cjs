const fs = require('fs');

let t1 = fs.readFileSync('server/routes/companies.ts', 'utf8');
t1 = t1.replace('parseInt(req.query.page) || 1', 'parseInt(req.query.page as string) || 1');
t1 = t1.replace('parseInt(req.query.limit) || 12', 'parseInt(req.query.limit as string) || 12');
fs.writeFileSync('server/routes/companies.ts', t1);

let t2 = fs.readFileSync('server/routes/tenders.ts', 'utf8');
t2 = t2.replace('parseInt(req.query.page) || 1', 'parseInt(req.query.page as string) || 1');
t2 = t2.replace('parseInt(req.query.limit) || 12', 'parseInt(req.query.limit as string) || 12');
fs.writeFileSync('server/routes/tenders.ts', t2);

let t3 = fs.readFileSync('src/pages/Products.tsx', 'utf8');
t3 = t3.replace('setActivePage(parseInt(page));', '');
t3 = t3.replace(`              <button 
                onClick={() => setActivePage(prev => prev + 1)}
                className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all"
              >
                {'>'}
              </button>`, '');
fs.writeFileSync('src/pages/Products.tsx', t3);
