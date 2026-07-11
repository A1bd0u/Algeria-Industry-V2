const fs = require('fs');
let file = fs.readFileSync('src/pages/Register.tsx', 'utf8');

file = file.replace(
  '<label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom</label>',
  '<label htmlFor="lastName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom</label>'
);
file = file.replace(
  '<input \n                        type="text"\n                        {...register(\'lastName\')}',
  '<input \n                        id="lastName"\n                        type="text"\n                        {...register(\'lastName\')}'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Prénom</label>',
  '<label htmlFor="firstName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Prénom</label>'
);
file = file.replace(
  '<input \n                        type="text" \n                        {...register(\'firstName\')}',
  '<input \n                        id="firstName"\n                        type="text" \n                        {...register(\'firstName\')}'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom de l\'entreprise</label>',
  '<label htmlFor="companyName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom de l\'entreprise</label>'
);
file = file.replace(
  '<input \n                        type="text" \n                        {...register(\'companyName\')}',
  '<input \n                        id="companyName"\n                        type="text" \n                        {...register(\'companyName\')}'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email professionnel</label>',
  '<label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email professionnel</label>'
);
file = file.replace(
  '<input \n                        type="email" \n                        {...register(\'email\')}',
  '<input \n                        id="email"\n                        type="email" \n                        {...register(\'email\')}'
);

file = file.replace(
  '<label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Mot de passe</label>',
  '<label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Mot de passe</label>'
);
file = file.replace(
  '<input \n                        type="password" \n                        {...register(\'password\')}',
  '<input \n                        id="password"\n                        type="password" \n                        {...register(\'password\')}'
);

fs.writeFileSync('src/pages/Register.tsx', file);
