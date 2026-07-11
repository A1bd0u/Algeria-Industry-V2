const fs = require('fs');
let file = fs.readFileSync('src/components/VerifyAccountModal.tsx', 'utf8');

file = file.replace(
  'className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4"',
  'className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4"\n      role="dialog"\n      aria-modal="true"\n      aria-label="Vérification de compte"'
);

file = file.replace(
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code de vérification</label>',
  '<label htmlFor="code_input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code de vérification</label>'
);

file = file.replace(
  'type="text"',
  'id="code_input"\n                  type="text"'
);

fs.writeFileSync('src/components/VerifyAccountModal.tsx', file);
