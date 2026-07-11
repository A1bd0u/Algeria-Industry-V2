# Sauvegardes et Restauration Supabase (Runbook)

## 1. Activer les sauvegardes automatiques et le Point-In-Time Recovery (PITR)

Sur Supabase, la stratégie de sauvegarde dépend de votre plan :
- **Pro Plan** : Sauvegardes quotidiennes automatiques (rétention de 7 jours).
- **Team / Enterprise Plan (ou Add-on PITR)** : Point-In-Time Recovery (PITR) actif.

**Pour activer le PITR :**
1. Allez sur le **Supabase Dashboard**.
2. Sélectionnez votre projet > **Database** > **Backups** (dans la barre latérale).
3. Allez dans l'onglet **Point in Time (PITR)**.
4. Si ce n'est pas activé, cliquez sur **Enable PITR** (nécessite de souscrire à l'option ou de passer au plan Team). Cela permet de restaurer la base de données à la seconde près.

---

## 2. Runbook de Restauration (En cas de perte de données)

Si une erreur de manipulation, une faille ou une corruption de données se produit, suivez ces étapes :

### Étape 1 : Isoler et Identifier
- Identifiez l'heure exacte ou approximative à laquelle l'incident s'est produit.
- (Optionnel) Stoppez temporairement le trafic backend si le système continue de corrompre les données.

### Étape 2 : Restauration via PITR (Recommandé)
1. Ouvrez le **Supabase Dashboard** > **Database** > **Backups** > **Point in Time**.
2. Sélectionnez la date et l'heure exactes **juste avant** l'incident.
3. Cliquez sur **Restore**.
4. Le projet passera en mode maintenance (indisponibilité de quelques minutes selon la taille des données).

### Étape 2 (Alternative) : Restauration via Daily Backup
Si le PITR n'est pas actif :
1. Allez dans **Database** > **Backups** > **Daily Backups**.
2. Sélectionnez la sauvegarde la plus récente qui précède l'incident.
3. Cliquez sur **Restore**.

### Étape 3 : Vérification Post-Restauration
1. Connectez-vous à la console d'administration.
2. Vérifiez que les données perdues sont de nouveau présentes.
3. Vérifiez les logs d'audit (`/extranet/security`) pour analyser la source de l'incident (ex: compte compromis) et appliquez les correctifs nécessaires (changement de mot de passe, suspension de l'utilisateur).
