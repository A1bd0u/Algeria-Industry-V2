const fs = require('fs');
let code = fs.readFileSync('src/pages/Favorites.tsx', 'utf-8');

code = code.replace(`  const removeFavorite = async (itemId: string) => {
    try {
      const res = await fetch(\`/api/favorites/item/\${itemId}\`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites(favorites.filter(f => f.item_id !== itemId));
        alert("Retiré des favoris");
      }
    } catch (e) {
      console.error(e);
    }
  };`, `  const removeFavorite = async (id: string) => {
    try {
      const res = await fetch(\`/api/favorites/\${id}\`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites(favorites.filter(f => f.id !== id));
        alert("Retiré des favoris");
      }
    } catch (e) {
      console.error(e);
    }
  };`);

code = code.replace(`onClick={() => removeFavorite(fav.item_id)}`, `onClick={() => removeFavorite(fav.id)}`);

fs.writeFileSync('src/pages/Favorites.tsx', code);
console.log("Updated Favorites.tsx");
