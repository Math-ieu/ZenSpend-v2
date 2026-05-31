# Spécification Technique - Insights Financiers IA & Assistant Conversationnel

Ce document détaille l'intégration d'analyses de données financières assistées par IA (Large Language Models) dans **ZenSpend-v2**.

## 1. Objectifs
- **Insights Personnalisés (`FinancialInsight`)** : Analyser automatiquement l'historique des transactions de l'utilisateur pour identifier des opportunités d'épargne, détecter des anomalies de dépenses, et proposer des ajustements de budget.
- **Chat Financier Intelligent (`ChatSession`, `ChatMessage`)** : Offrir une interface de discussion intuitive dans laquelle l'utilisateur peut interroger un agent IA sur ses finances (ex. "Combien ai-je dépensé en restaurants ce mois-ci ?" ou "Puis-je me permettre d'acheter un nouveau vélo à 800€ ?").

## 2. Architecture Technique (Back-End)

Les services IA s'appuient sur l'API Gemini de Google via le SDK officiel ou des appels HTTP optimisés.

### Dépendances suggérées :
```text
google-generativeai
```

### Modèles Existants de Support IA :
```python
class FinancialInsight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    insight_type = models.CharField(max_length=50, choices=[
        ('spending_pattern', 'Spending Pattern'),
        ('saving_opportunity', 'Saving Opportunity'),
        ('budget_suggestion', 'Budget Suggestion'),
        ('anomaly_detection', 'Anomaly Detection'),
        ('forecast_alert', 'Forecast Alert'),
    ])
    priority = models.IntegerField()  # 1 (haute) à 3 (basse)
    viewed = models.BooleanField(default=False)
    related_data = models.JSONField(default=dict)

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    started_at = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    context = models.JSONField(default=dict)

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_bot = models.BooleanField()
    message_type = models.CharField(max_length=20, default='text')
    action_data = models.JSONField(default=dict, blank=True)
```

## 3. Implémentation du Générateur d'Insights (`insights_generator.py`)

Ce script/tâche périodique compile les données mensuelles de l'utilisateur pour les soumettre au LLM.

```python
import google.generativeai as genai
from django.conf import settings
from .models import Transaction, FinancialInsight
import json

class FinancialInsightsGenerator:
    def __init__(self, user):
        self.user = user
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def generate_monthly_insights(self):
        # 1. Collecte des transactions des 30 derniers jours
        transactions = Transaction.objects.filter(user=self.user).order_by('-date')[:100]
        tx_data = [
            {
                "amount": float(tx.amount),
                "category": tx.category.name if tx.category else "Autre",
                "description": tx.description,
                "date": tx.date.strftime('%Y-%m-%d')
            }
            for tx in transactions
        ]

        # 2. Préparation du Prompt
        prompt = f"""
        Tu es un conseiller financier IA expert et bienveillant.
        Voici les transactions récentes de l'utilisateur ({self.user.first_name}) :
        {json.dumps(tx_data)}

        Génère un insight financier utile sous forme d'objet JSON contenant les clés exactes suivantes :
        - "title" : Titre court et engageant.
        - "description" : Explication détaillée avec des conseils d'actions réalistes.
        - "insight_type" : L'un des suivants : "spending_pattern", "saving_opportunity", "budget_suggestion", "anomaly_detection".
        - "priority" : Entier entre 1 (priorité absolue) et 3 (conseil secondaire).
        
        Ne réponds qu'avec le JSON brut, aucun autre texte explicatif.
        """

        # 3. Appel du modèle
        response = self.model.generate_content(prompt)
        try:
            insight_json = json.loads(response.text.strip('`json\n'))
            
            # Enregistrement en base de données
            FinancialInsight.objects.create(
                user=self.user,
                title=insight_json["title"],
                description=insight_json["description"],
                insight_type=insight_json["insight_type"],
                priority=insight_json["priority"]
            )
        except Exception as e:
            # Fallback en cas d'erreur de parsing JSON
            print(f"Erreur d'analyse IA : {str(e)}")
```

## 4. Assistant Conversationnel (Chat API)
- L'utilisateur envoie une question dans `chat-messages/` (API).
- Le serveur charge la session de chat et injecte les transactions actuelles en tant que contexte système.
- Le LLM formule une réponse claire et synthétique directement au format texte, renvoyée au client.
