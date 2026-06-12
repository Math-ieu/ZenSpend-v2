# Utilise une image Python (3.12 : le code utilise des f-strings PEP 701)
FROM python:3.12-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Créer un répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers du backend
COPY zenspendproject/ /app/

# Installer les dépendances Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Exposer le port
EXPOSE 8000

# Commande par défaut
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
