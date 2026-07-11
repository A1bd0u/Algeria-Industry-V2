const fs = require('fs');
let file = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

file = file.replace(
  '<button\n              onClick={() => setIsOpen(!isOpen)}\n              className="text-white hover:text-secondary focus:outline-none p-2 bg-white/5 rounded-lg"\n            >',
  '<button\n              onClick={() => setIsOpen(!isOpen)}\n              aria-expanded={isOpen}\n              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}\n              className="text-white hover:text-secondary focus:outline-none p-3 bg-white/5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"\n            >'
);

// Add role="button" aria-haspopup="true" for dropdowns
file = file.replace(
  '<div \n                  onClick={() => setShowLang(!showLang)}\n                  className="flex items-center',
  '<button \n                  onClick={() => setShowLang(!showLang)}\n                  aria-expanded={showLang}\n                  aria-label="Changer de langue"\n                  aria-haspopup="true"\n                  className="flex items-center'
);
// Need to replace the closing tag of that div to button
file = file.replace(
  '<ChevronDown className="w-3 h-3 text-white/40 group-hover/lang:text-white transition-colors" />\n                </div>',
  '<ChevronDown className="w-3 h-3 text-white/40 group-hover/lang:text-white transition-colors" />\n                </button>'
);


fs.writeFileSync('src/components/Navbar.tsx', file);
