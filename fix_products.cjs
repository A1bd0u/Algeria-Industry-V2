const fs = require('fs');
let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// We already have useQuery imported? Probably not.
if (!products.includes('@tanstack/react-query')) {
  products = products.replace(
    "import React, { useEffect, useState, useRef } from 'react';",
    "import React, { useEffect, useState, useRef } from 'react';\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { RefreshCw } from 'lucide-react';"
  );
  
  // replace the fetchProducts with useQuery
  // The structure is quite complex. Let's do it carefully.
  const searchStart = products.indexOf('  useEffect(() => {\n    const fetchProducts = async () => {');
  const searchEnd = products.indexOf('  }, [searchParams, isAuthenticated]);', searchStart) + 38;
  
  const queryStr = `
  const { data: productsData = { data: [], totalItems: 0, totalPages: 1 }, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', searchParams.toString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      const page = searchParams.get('page') || '1';
      params.append('page', page);
      params.append('limit', '12');
      if (searchParams.get('search')) params.append('search', searchParams.get('search')!);
      if (searchParams.get('category')) params.append('category', searchParams.get('category')!);
      if (searchParams.get('companyId')) params.append('company_id', searchParams.get('companyId')!);
      
      const res = await fetch(\`/api/products?\${params.toString()}\`);
      if (!res.ok) throw new Error('Erreur lors du chargement des produits');
      
      let result = await res.json();
      const formattedData = (result.data || []).map((p: any) => ({
          id: p.id,
          reference_id: p.reference_id,
          name: p.name,
          brand: p.company_name || 'Marque Standard',
          price: p.price,
          category: p.category || 'Non catégorisé',
          region: p.region || 'Alger',
          image: p.file_url || p.image_url || \`https://picsum.photos/seed/\${p.id}/600/400\`,
          features: p.features || ['Produit de qualité'],
          verified: p.verified || false,
          owner_id: p.owner_id || p.company_id
      }));
      return {
        data: formattedData,
        totalItems: result.total || 0,
        totalPages: result.totalPages || 1
      };
    }
  });
  
  const products = productsData.data;
  const totalPages = productsData.totalPages;
  const totalItems = productsData.totalItems;
`;
  products = products.substring(0, searchStart) + queryStr + products.substring(searchEnd);
  
  // Need to remove the states for products, totalPages, totalItems, isLoading, error
  products = products.replace(/  const \[products, setProducts\] = useState<any\[\]>\(\[\]\);\n/g, '');
  products = products.replace(/  const \[isLoading, setIsLoading\] = useState\(true\);\n/g, '');
  products = products.replace(/  const \[error, setError\] = useState\(''\);\n/g, '');
  products = products.replace(/  const \[totalPages, setTotalPages\] = useState\(1\);\n/g, '');
  products = products.replace(/  const \[totalItems, setTotalItems\] = useState\(0\);\n/g, '');
  
  fs.writeFileSync('src/pages/Products.tsx', products);
}
