// Colonnes de la table users qui peuvent quitter le serveur.
// Ne jamais utiliser select('*') sur users dans une réponse API :
// la table contient le hash du mot de passe et des compteurs de sécurité.
export const PUBLIC_USER_COLUMNS =
  'id, reference_id, name, email, company, company_id, role, email_verified, kyc_status, created_at';

export const toPublicUser = (row: any, companyStatus: string | null = null) => {
  if (!row) return row;
  const kycStatus = row.kyc_status || 'none';
  return {
    id: row.id,
    reference_id: row.reference_id ?? null,
    name: row.name,
    email: row.email,
    company: row.company ?? null,
    company_id: row.company_id ?? null,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    kycStatus,
    isVerified: kycStatus === 'approved',
    companyStatus,
    created_at: row.created_at ?? null,
  };
};

export const extractCompanyStatus = (companies: any): string | null => {
  if (!companies) return null;
  if (Array.isArray(companies)) return companies[0]?.status ?? null;
  return companies.status ?? null;
};
