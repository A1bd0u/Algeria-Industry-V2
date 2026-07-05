const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf-8');

code = code.replace(`  const [isFavorite, setIsFavorite] = useState(false);`, `  const [favoriteId, setFavoriteId] = useState<string | null>(null);`);

code = code.replace(`    const fetchFavoriteStatus = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          setIsFavorite(data.some((f: any) => f.item_id === id));
        }
      } catch (err) {
        console.error(err);
      }
    };`, `    const fetchFavoriteStatus = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          const fav = data.find((f: any) => f.item_id === id);
          if (fav) setFavoriteId(fav.id);
        }
      } catch (err) {
        console.error(err);
      }
    };`);

code = code.replace(`  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await fetch(\`/api/favorites/item/\${id}\`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: 'product', item_id: id })
        });
        if (res.ok) {
          setIsFavorite(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };`, `  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (favoriteId) {
        await fetch(\`/api/favorites/\${favoriteId}\`, { method: 'DELETE' });
        setFavoriteId(null);
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: 'product', item_id: id })
        });
        if (res.ok) {
          const data = await res.json();
          setFavoriteId(data.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };`);

code = code.replace(`{isFavorite ? 'Retirer' : 'Sauvegarder'}`, `{favoriteId ? 'Retirer' : 'Sauvegarder'}`);
code = code.replace(`fill={isFavorite ? "currentColor" : "none"}`, `fill={favoriteId ? "currentColor" : "none"}`);
code = code.replace(`className={cn("p-4 rounded-xl transition-all", isFavorite ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}`, `className={cn("p-4 rounded-xl transition-all", favoriteId ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}`);

fs.writeFileSync('src/pages/ProductDetail.tsx', code);
console.log("Updated ProductDetail.tsx");
