const fs = require('fs');
let dir = fs.readFileSync('src/pages/Directory.tsx', 'utf8');

// Replace standard fetch with useQuery
const importQuery = "import { useQuery } from '@tanstack/react-query';\n";
const importAlert = "import { AlertTriangle, RefreshCw } from 'lucide-react';\n";

if (!dir.includes('useQuery')) {
  dir = dir.replace("import { useEffect, useState } from 'react';", "import { useState } from 'react';\n" + importQuery + importAlert);
  
  // Remove useEffect and replace with useQuery
  const searchStart = dir.indexOf('  useEffect(() => {');
  const searchEnd = dir.indexOf('  const sectors = [', searchStart);
  
  const newQueryCode = `
  const { data: companies = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['companies', isCertifiedOnly, selectedRegion, selectedSectors],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isCertifiedOnly) params.append('certified', 'true');
      if (selectedRegion !== t('common.all') && selectedRegion) params.append('region', selectedRegion);
      if (selectedSectors.length > 0) params.append('sectors', selectedSectors.join(','));
      
      const res = await fetch(\`/api/companies?\${params.toString()}\`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      const result = await res.json();
      const data = result.data || result;
      
      return data.map((c: any) => ({
        ...c,
        id: c.id,
        name: c.name,
        sector: c.activity_sector || "Non spécifié",
        region: c.region || "Alger",
        coordinates: { x: Math.floor(Math.random() * 40) + 30, y: Math.floor(Math.random() * 40) + 10 },
        description: c.description || "Aucune description",
        certified: c.certified || false,
        logo: \`https://picsum.photos/seed/\${c.id}/100/100\`,
        employees: "50-100",
        founded: "2020"
      }));
    }
  });

`;
  
  dir = dir.substring(0, searchStart) + newQueryCode + dir.substring(searchEnd);
  
  // Need to replace the error and empty states
  // find {isLoading ? ( ... ) : error ? ( ... ) : filteredCompanies.length === 0 ? ( ... )
  // This might be tricky. Let's do it with regex or manual replacement.
  fs.writeFileSync('src/pages/Directory.tsx', dir);
}
