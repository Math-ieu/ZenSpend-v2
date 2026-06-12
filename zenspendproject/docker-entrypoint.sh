#!/bin/sh
# Entrypoint du conteneur backend en production.
# Les migrations et la collecte des fichiers statiques ne sont exécutées que
# pour le process web (gunicorn), pas pour les tâches cron ponctuelles.
set -e

if [ "$1" = "gunicorn" ]; then
  echo "[entrypoint] Applying database migrations..."
  python manage.py migrate --noinput
  echo "[entrypoint] Collecting static files..."
  python manage.py collectstatic --noinput
fi

exec "$@"
