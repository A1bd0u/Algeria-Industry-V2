const fs = require('fs');
let file = fs.readFileSync('src/pages/Contact.tsx', 'utf8');

file = file.replace(
  '<label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>',
  '<label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>'
);
file = file.replace(
  '<input \n                          type="text" \n                          required',
  '<input \n                          id="name"\n                          type="text" \n                          required'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email professionnel</label>',
  '<label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email professionnel</label>'
);
file = file.replace(
  '<input \n                          type="email" \n                          required',
  '<input \n                          id="email"\n                          type="email" \n                          required'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet</label>',
  '<label htmlFor="subject" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet</label>'
);
file = file.replace(
  '<input \n                        type="text" \n                        required',
  '<input \n                        id="subject"\n                        type="text" \n                        required'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>',
  '<label htmlFor="message" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>'
);
file = file.replace(
  '<textarea \n                        rows={4} \n                        required',
  '<textarea \n                        id="message"\n                        rows={4} \n                        required'
);

fs.writeFileSync('src/pages/Contact.tsx', file);
