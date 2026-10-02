#!/usr/bin/env bash
# Rejoue toutes les migrations deux fois sur une base PostgreSQL vide.
# - 1re passe : installation sur une base neuve.
# - 2e passe : situation de la production quand l'historique Supabase est vide
#   ou incomplet (tables déjà présentes) : chaque migration doit être rejouable.
# Connexion via les variables PG* habituelles (PGHOST, PGPORT, PGUSER, PGPASSWORD).
set -euo pipefail

DB="${1:-migrations_replay}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql -v ON_ERROR_STOP=1 -qc "DROP DATABASE IF EXISTS ${DB}" postgres
psql -v ON_ERROR_STOP=1 -qc "CREATE DATABASE ${DB}" postgres
psql -v ON_ERROR_STOP=1 -q -d "${DB}" -f "${ROOT}/supabase/tests/supabase_shim.sql" > /dev/null

for pass in 1 2; do
  for file in "${ROOT}"/supabase/migrations/*.sql; do
    if ! psql -v ON_ERROR_STOP=1 -q -1 -d "${DB}" -f "${file}" > /dev/null 2> /tmp/replay-error.log; then
      echo "Passe ${pass} : échec de $(basename "${file}")"
      grep -v NOTICE /tmp/replay-error.log | head -5
      exit 1
    fi
  done
  echo "Passe ${pass} : $(ls "${ROOT}"/supabase/migrations/*.sql | wc -l) migrations appliquées."
done
