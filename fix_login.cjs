const fs = require('fs');
let file = fs.readFileSync('src/pages/Login.tsx', 'utf8');

file = file.replace(
  '<label className="block text-sm font-semibold text-gray-700 mb-2">Adresse Email</label>',
  '<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Adresse Email</label>'
);
file = file.replace(
  '<input \n                  type="text"\n                  {...register(\'email\')}',
  '<input \n                  id="email"\n                  type="text"\n                  {...register(\'email\')}'
);

file = file.replace(
  '<label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>',
  '<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>'
);
// wait, the password label may not be exact, I didn't see the password label text fully.
// Let's just do a regex replace for the input.
file = file.replace(
  '<input \n                  type={showPassword ? "text" : "password"}\n                  {...register(\'password\')}',
  '<input \n                  id="password"\n                  type={showPassword ? "text" : "password"}\n                  {...register(\'password\')}'
);

fs.writeFileSync('src/pages/Login.tsx', file);
