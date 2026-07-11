const fs = require('fs');
let file = fs.readFileSync('src/components/SearchModal.tsx', 'utf8');

// Add aria-modal, role to the dialog container
file = file.replace(
  'className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10"',
  'role="dialog"\n            aria-modal="true"\n            aria-label="Recherche"\n            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10"'
);

// Add aria-label to input
file = file.replace(
  'placeholder="Rechercher un produit ou une entreprise..."',
  'placeholder="Rechercher un produit ou une entreprise..."\n                aria-label="Rechercher un produit ou une entreprise"'
);

// Add aria-label to close button
file = file.replace(
  'className="p-2 hover:bg-gray-100 rounded-full transition-colors"',
  'aria-label="Fermer la recherche"\n                className="p-2 hover:bg-gray-100 rounded-full transition-colors"'
);

// Keyboard accessibility: handleSelect should also handle Enter if focused (it's a button usually but here it's an a or div)
// Let's check what it is:
// Search results rendering:
file = file.replace(
  'onClick={() => handleSelect(result)}',
  'onClick={() => handleSelect(result)}\n                        onKeyDown={(e) => { if (e.key === \'Enter\' || e.key === \' \') { e.preventDefault(); handleSelect(result); } }}'
);

fs.writeFileSync('src/components/SearchModal.tsx', file);
