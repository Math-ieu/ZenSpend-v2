# Spécification Technique - Intégration OCR des Reçus

Ce document décrit l'implémentation du service d'extraction automatique d'informations de reçus par OCR dans **ZenSpend-v2**.

## 1. Objectifs
- Permettre à l'utilisateur de charger une image de reçu (`.jpg`, `.png`, `.jpeg`).
- Extraire automatiquement :
  - Le montant total.
  - La date de la transaction.
  - Le marchand ou bénéficiaire (`payee`).
  - Le texte brut complet (`ocr_text`).
- Associer ces informations au modèle de données `Receipt` et pré-remplir le formulaire front-end.

## 2. Architecture Technique (Back-End)

Le service OCR sera hébergé dans une classe dédiée sous `zenspendbackend/services/ocr.py`.

### Dépendances suggérées :
Dans `requirements.txt` :
```text
pytesseract
Pillow
```

### Modèle de Données Existant (`models.py`) :
```python
class Receipt(models.Model):
    transaction = models.OneToOneField('Transaction', on_delete=models.CASCADE, related_name='receipt')
    image_url = models.CharField(max_length=255, blank=True)
    ocr_text = models.TextField(blank=True)
    processed_data = models.JSONField(default=dict, blank=True)
    date_added = models.DateTimeField(default=timezone.now)
```

### Classe Service Proposée (`ocr.py`) :
```python
import pytesseract
from PIL import Image
import re
from datetime import datetime

class ReceiptOCRService:
    @staticmethod
    def extract_text_from_image(image_path: str) -> str:
        """Extrait le texte brut de l'image à l'aide de Tesseract OCR."""
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, lang='fra+eng')
            return text
        except Exception as e:
            raise RuntimeError(f"Erreur d'OCR: {str(e)}")

    @staticmethod
    def parse_receipt_data(ocr_text: str) -> dict:
        """Analyse le texte brut avec des expressions régulières pour trouver le montant et la date."""
        data = {
            "amount": None,
            "date": None,
            "payee": None
        }
        
        # Recherche du montant total (ex: TOTAL, NET, EUR, €)
        amount_patterns = [
            r'(?:total|net|a payer|payable)\s*[:\-\s]*\s*([0-9]+[.,][0-9]{2})',
            r'([0-9]+[.,][0-9]{2})\s*(?:€|eur)',
        ]
        for pattern in amount_patterns:
            matches = re.findall(pattern, ocr_text, re.IGNORECASE)
            if matches:
                data["amount"] = float(matches[0].replace(',', '.'))
                break
                
        # Recherche de la date (ex: DD/MM/YYYY ou YYYY-MM-DD)
        date_patterns = [
            r'(\d{2}/\d{2}/\d{4})',
            r'(\d{4}-\d{2}-\d{2})'
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, ocr_text)
            if matches:
                data["date"] = matches[0]
                break
                
        # Le bénéficiaire (payee) peut être extrait depuis la première ligne non vide
        lines = [line.strip() for line in ocr_text.split('\n') if line.strip()]
        if lines:
            data["payee"] = lines[0][:100]
            
        return data
```

## 3. Flux Front-End (React)
1. L'utilisateur clique sur la zone de dropzone (`TransactionForm.tsx`).
2. L'image est envoyée via une route API `POST /api/receipts/ocr/` (nouvelle route à créer).
3. Le back-end exécute le service OCR et renvoie le JSON structuré de `processed_data`.
4. Le formulaire d'ajout ou de modification de transaction est pré-rempli avec les valeurs détectées (montant, bénéficiaire, date) et l'utilisateur n'a plus qu'à valider.
