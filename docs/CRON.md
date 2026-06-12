# Tâches planifiées (cron)

ZenSpend a trois commandes de gestion Django destinées à être exécutées
périodiquement :

| Commande | Rôle | Cadence conseillée |
| --- | --- | --- |
| `generate_recurring_transactions` | Génère les transactions récurrentes échues | quotidien (00:30 UTC) |
| `purge_deleted_accounts` | Supprime définitivement les comptes désactivés au-delà de 30 jours (RGPD / Play Store) | quotidien (03:00 UTC) |
| `generate_notifications` | Génère les notifications budget / objectifs / dettes | quotidien (07:00 UTC) |

## Déploiement Docker Compose (par défaut)

Le service `scheduler` (image [Ofelia](https://github.com/mcuadros/ofelia))
défini dans `docker-compose.yml` lit les labels `ofelia.*` du service `backend`
et exécute chaque commande dans le conteneur backend à l'heure prévue. Rien à
faire de plus que :

```bash
docker compose up -d
```

Vérifier que le scheduler tourne et voir les exécutions :

```bash
docker compose logs -f scheduler
```

Modifier une cadence : éditer le label `ofelia.job-exec.<job>.schedule` dans
`docker-compose.yml` (format à 6 champs : `seconde minute heure jour mois jour-semaine`)
puis `docker compose up -d`.

## Déploiement hôte (VPS sans Docker)

Ajouter au crontab de l'utilisateur applicatif (`crontab -e`). Adapter le chemin
du projet et du virtualenv :

```cron
ZENSPEND=/chemin/vers/zenspendproject
# Transactions récurrentes — tous les jours à 00:30
30 0 * * * cd $ZENSPEND && venv/bin/python manage.py generate_recurring_transactions >> /var/log/zenspend-cron.log 2>&1
# Purge des comptes supprimés — tous les jours à 03:00
0 3 * * * cd $ZENSPEND && venv/bin/python manage.py purge_deleted_accounts >> /var/log/zenspend-cron.log 2>&1
# Notifications — tous les jours à 07:00
0 7 * * * cd $ZENSPEND && venv/bin/python manage.py generate_notifications >> /var/log/zenspend-cron.log 2>&1
```

## Test manuel

```bash
# Voir ce qui serait purgé sans rien supprimer
python manage.py purge_deleted_accounts --dry-run

# Changer le délai de rétention (défaut : 30 jours)
python manage.py purge_deleted_accounts --days 30
```
