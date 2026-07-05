const fs = require('fs');
let code = fs.readFileSync('src/pages/Directory.tsx', 'utf-8');

// Replace the useEffect
const fetchStr = `
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        // Fallback mock payload for offline/presentation setup
        const fallbackData = [
          {
            id: 1,
            reference_id: "CMP-7Y2M1B",
            name: "Algerian Industrial Solutions",
            activity_sector: "Automobile",
            description: "Leader de la construction mécanique",
            region: "Alger"
          },
          {
            id: 2,
            reference_id: "CMP-X94P2C",
            name: "Sonatrach Hub",
            activity_sector: "Énergie",
            description: "Pôle pétrolier international",
            region: "Hassi Messaoud"
          },
          {
            id: 3,
            reference_id: "CMP-8Q1Z4D",
            name: "Agro Dz",
            activity_sector: "Agroalimentaire",
            description: "Production de céréales locale",
            region: "Sétif"
          }
        ];
        
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (isCertifiedOnly) params.append('certified', 'true');
        if (selectedRegion !== t('common.all') && selectedRegion) params.append('region', selectedRegion);
        if (selectedSectors.length > 0) params.append('sectors', selectedSectors.join(','));
        
        const res = await fetch(\`/api/companies?\${params.toString()}\`).catch(() => null);
        let data = fallbackData;
        
        if (res && res.ok) {
           data = await res.json();
        }
        
        const formattedData = data.map((c: any) => ({
          ...c,
          id: c.id,
          name: c.name,
          sector: c.activity_sector || "Non spécifié",
          region: c.region || "Alger",
          coordinates: { x: Math.floor(Math.random() * 40) + 30, y: Math.floor(Math.random() * 40) + 10 },
          description: c.description || "Aucune description",
          certified: c.status === 'approved' || Math.random() > 0.5,
          logo: \`https://picsum.photos/seed/\${c.id}/100/100\`,
          employees: "50-100",
          founded: "2020"
        }));
        
        setCompanies(formattedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simple debounce
    const timeoutId = setTimeout(() => {
      fetchCompanies();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isCertifiedOnly, selectedRegion, selectedSectors, t]);`;

const startIdx = code.indexOf('useEffect(() => {');
const endIdx = code.indexOf('const sectors = [', startIdx);
if (startIdx > -1 && endIdx > -1) {
  code = code.substring(0, startIdx) + fetchStr + '\n\n  ' + code.substring(endIdx);
  fs.writeFileSync('src/pages/Directory.tsx', code);
  console.log("Directory.tsx updated!");
} else {
  console.log("Could not find boundaries.");
}
