#!/usr/bin/env python3
"""
Script d'automatisation pour insérer des données fictives dans ZenSpend
Usage: python populate_data.py [--base-url http://localhost:8000]
"""

import requests
import json
import time
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class ZenSpendDataPopulator:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Stockage des tokens et IDs pour les relations
        self.tokens = {}
        self.user_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log avec timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, 
                    token: str = None) -> Optional[Dict[Any, Any]]:
        """Faire une requête HTTP avec gestion d'erreurs"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            else:
                raise ValueError(f"Méthode non supportée: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.log(f"Erreur lors de la requête {method} {endpoint}: {e}", "ERROR")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    self.log(f"Détails de l'erreur: {error_detail}", "ERROR")
                except:
                    self.log(f"Réponse brute: {e.response.text}", "ERROR")
            return None
            
    def wait(self, seconds: float = 0.5):
        """Attendre entre les requêtes pour éviter le rate limiting"""
        time.sleep(seconds)
        
    def create_users(self):
        """Créer les deux utilisateurs de test"""
        self.log("=== Création des utilisateurs ===")
        
        users = [
            {
                "email": "marie.dupont@email.com",
                "first_name": "Marie",
                "last_name": "Dupont",
                "phone_number": "+33123456789",
                "preferred_currency": "EUR",
                "password": "MotDePasse123!",
                "password_confirm": "MotDePasse123!"
            },
            {
                "email": "pierre.martin@email.com",
                "first_name": "Pierre",
                "last_name": "Martin",
                "phone_number": "+33987654321",
                "preferred_currency": "EUR",
                "password": "MotDePasse123!",
                "password_confirm": "MotDePasse123!"
            }
        ]
        
        for user_data in users:
            self.log(f"Création de l'utilisateur: {user_data['email']}")
            result = self.make_request('POST', '/auth/register/', user_data)
            if result:
                self.log(f"Utilisateur créé avec succès: {user_data['first_name']} {user_data['last_name']}")
            self.wait()
            
    def login_users(self):
        """Se connecter pour récupérer les tokens"""
        self.log("=== Connexion des utilisateurs ===")
        
        login_data = [
            {
                "email": "marie.dupont@email.com",
                "password": "MotDePasse123!",
                "name": "marie"
            }, 
            {
                "email": "pierre.martin@email.com", 
                "password": "MotDePasse123!",
                "name": "pierre"
            }
        ]
        
        for login in login_data:
            self.log(f"Connexion de: {login['email']}")
            result = self.make_request('POST', '/auth/login/', {
                'email': login['email'],
                'password': login['password']
            })
            
            if result and 'access' in result:
                self.tokens[login['name']] = result['access']
                self.user_data[login['name']] = {
                    'id': result['user']['id'],
                    'email': result['user']['email'],
                    'accounts': [],
                    'categories': [],
                    'tags': []
                }
                self.log(f"Connexion réussie pour {login['name']}")
            else:
                self.log(f"Échec de la connexion pour {login['email']}", "ERROR")
            self.wait()
            
    def create_marie_data(self):
        """Créer les données pour Marie Dupont"""
        self.log("=== Création des données pour Marie Dupont ===")
        
        if 'marie' not in self.tokens:
            self.log("Token Marie non disponible", "ERROR")
            return
            
        token = self.tokens['marie']
        user_id = self.user_data['marie']['id']
        
        # Comptes bancaires
        self.log("Création des comptes bancaires de Marie")
        accounts = [
            {
                "name": "Compte Courant BNP",
                "account_number": "FR76 3000 6000 0112 3456 7890 189",
                "balance": 2500.50,
                "currency": "EUR",
                "account_type": "checking",
                "institution": "BNP Paribas",
                "is_active": True,
                "user": user_id
            },
            {
                "name": "Livret A",
                "account_number": "FR76 3000 6000 0112 3456 7890 190", 
                "balance": 15000.00,
                "currency": "EUR",
                "account_type": "savings",
                "institution": "BNP Paribas",
                "is_active": True,
                "user": user_id
            }
        ]
        
        for account_data in accounts:
            result = self.make_request('POST', '/accounts/', account_data, token)
            if result:
                self.user_data['marie']['accounts'].append(result['id'])
                self.log(f"Compte créé: {account_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Catégories
        self.log("Création des catégories de Marie")
        categories = [
            {
                "name": "Courses alimentaires",
                "icon": "🛒",
                "color": "#4CAF50",
                "is_expense": True,
                "is_tax_deductible": False,
                "parent_category": None,
                "user": user_id
            },
            {
                "name": "Frais professionnels",
                "icon": "💼", 
                "color": "#2196F3",
                "is_expense": True,
                "is_tax_deductible": True,
                "parent_category": None,
                "user": user_id
            },
            {
                "name": "Salaire",
                "icon": "💰",
                "color": "#8BC34A",
                "is_expense": False,
                "is_tax_deductible": False,
                "parent_category": None,
                "user": user_id
            }
        ]
        
        for category_data in categories:
            result = self.make_request('POST', '/categories/', category_data, token)
            if result:
                self.user_data['marie']['categories'].append(result['id'])
                self.log(f"Catégorie créée: {category_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Tags
        self.log("Création des tags de Marie")
        tags = [
            {"name": "Urgent", "color": "#F44336", "user": user_id},
            {"name": "Bio", "color": "#4CAF50", "user": user_id},
            {"name": "Récurrent", "color": "#FF9800", "user": user_id}
        ]
        
        for tag_data in tags:
            result = self.make_request('POST', '/tags/', tag_data, token)
            if result:
                self.user_data['marie']['tags'].append(result['id'])
                self.log(f"Tag créé: {tag_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Transactions
        self.log("Création des transactions de Marie")
        marie_accounts = self.user_data['marie']['accounts']
        marie_categories = self.user_data['marie']['categories'] 
        marie_tags = self.user_data['marie']['tags']
        
        if len(marie_accounts) >= 1 and len(marie_categories) >= 3:
            transactions = [
                {
                    "amount": 3200.00,
                    "description": "Salaire mensuel",
                    "date": "2024-08-01",
                    "category": marie_categories[2],  # Salaire
                    "account": marie_accounts[0],     # Compte courant
                    "payee": "Entreprise ABC",
                    
                    "tags": [marie_tags[2]] if len(marie_tags) >= 3 else [],
                    "user": user_id
                },
                {
                    "amount": -85.50,
                    "description": "Courses Carrefour",
                    "date": "2024-08-05",
                    "category": marie_categories[0],  # Courses
                    "account": marie_accounts[0],
                    "payee": "Carrefour",
                    "location": "Carrefour City Paris",
                     
                    "tags": marie_tags[1:3] if len(marie_tags) >= 3 else [],
                    "user": user_id
                },
                {
                    "amount": -45.00,
                    "description": "Déjeuner client",
                    "date": "2024-08-06",
                    "category": marie_categories[1],  # Frais pro
                    "account": marie_accounts[0],
                    "payee": "Restaurant Le Bistrot",
                    
                    "notes": "Repas avec client important",
                    "user": user_id
                },
                {
                    "amount": -1200.00,
                    "description": "Loyer appartement",
                    "date": "2024-08-01",
                    "account": marie_accounts[0],
                    "payee": "Propriétaire Dupuis", 
                    
                    "tags": [marie_tags[2]] if len(marie_tags) >= 3 else [],
                    "user": user_id
                }
            ]
            
            for transaction_data in transactions:
                result = self.make_request('POST', '/transactions/', transaction_data, token)
                if result:
                    self.log(f"Transaction créée: {transaction_data['description']} ({transaction_data['amount']}€)")
                self.wait()
                
        # Budget
        self.log("Création du budget de Marie")
        if len(marie_categories) >= 1 and len(marie_accounts) >= 1:
            budget_data = {
                "name": "Budget Courses Août",
                "amount": 400.00,
                "start_date": "2024-08-01",
                "end_date": "2024-08-31",
                "categories": [marie_categories[0]],
                "accounts": [marie_accounts[0]],
                "alert_threshold": 80.0,
                "is_recurring": False,
                "user": user_id
            }
            
            result = self.make_request('POST', '/budgets/', budget_data, token)
            if result:
                self.log(f"Budget créé: {budget_data['name']}")
            self.wait()
            
        # Objectif d'épargne
        self.log("Création de l'objectif d'épargne de Marie")
        if len(marie_accounts) >= 2:
            savings_goal_data = {
                "name": "Vacances d'été 2025",
                "target_amount": 3000.00,
                "current_amount": 500.00,
                "deadline": "2025-06-01",
                "icon": "🏖️",
                "account": marie_accounts[1],  # Livret A
                "auto_save": True,
                "auto_save_amount": 200.00,
                "auto_save_frequency": "monthly",
                "notes": "Voyage en Grèce prévu",
                "user": user_id
            }
            
            result = self.make_request('POST', '/savings-goals/', savings_goal_data, token)
            if result:
                self.log(f"Objectif d'épargne créé: {savings_goal_data['name']}")
            self.wait()
            
    def create_pierre_data(self):
        """Créer les données pour Pierre Martin"""
        self.log("=== Création des données pour Pierre Martin ===")
        
        if 'pierre' not in self.tokens:
            self.log("Token Pierre non disponible", "ERROR")
            return
            
        token = self.tokens['pierre']
        user_id = self.user_data['pierre']['id']
        
        # Comptes bancaires
        self.log("Création des comptes bancaires de Pierre")
        accounts = [
            {
                "name": "Compte Principal Crédit Agricole",
                "account_number": "FR14 2004 1010 0505 0001 3M02 606",
                "balance": 1850.75,
                "currency": "EUR",
                "account_type": "checking",
                "institution": "Crédit Agricole",
                "is_active": True,
                "user": user_id
            },
            {
                "name": "PEL",
                "account_number": "FR14 2004 1010 0505 0001 3M02 607",
                "balance": 25000.00,
                "currency": "EUR", 
                "account_type": "savings",
                "institution": "Crédit Agricole",
                "is_active": True,
                "user": user_id
            }
        ]
        
        for account_data in accounts:
            result = self.make_request('POST', '/accounts/', account_data, token)
            if result:
                self.user_data['pierre']['accounts'].append(result['id'])
                self.log(f"Compte créé: {account_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Catégories
        self.log("Création des catégories de Pierre")
        categories = [
            {
                "name": "Transport",
                "icon": "🚗",
                "color": "#FF5722",
                "is_expense": True,
                "is_tax_deductible": False,
                "parent_category": None,
                "user": user_id
            },
            {
                "name": "Loisirs",
                "icon": "🎮",
                "color": "#9C27B0",
                "is_expense": True,
                "is_tax_deductible": False,
                "parent_category": None,
                "user": user_id
            },
            {
                "name": "Revenus freelance",
                "icon": "💻",
                "color": "#00BCD4",
                "is_expense": False,
                "is_tax_deductible": False,
                "parent_category": None,
                "user": user_id
            }
        ]
        
        for category_data in categories:
            result = self.make_request('POST', '/categories/', category_data, token)
            if result:
                self.user_data['pierre']['categories'].append(result['id'])
                self.log(f"Catégorie créée: {category_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Tags
        self.log("Création des tags de Pierre")
        tags = [
            {"name": "Professionnel", "color": "#3F51B5", "user": user_id},
            {"name": "Weekend", "color": "#E91E63", "user": user_id}
        ]
        
        for tag_data in tags:
            result = self.make_request('POST', '/tags/', tag_data, token)
            if result:
                self.user_data['pierre']['tags'].append(result['id'])
                self.log(f"Tag créé: {tag_data['name']} (ID: {result['id']})")
            self.wait()
            
        # Transactions
        self.log("Création des transactions de Pierre")
        pierre_accounts = self.user_data['pierre']['accounts']
        pierre_categories = self.user_data['pierre']['categories']
        pierre_tags = self.user_data['pierre']['tags']
        
        if len(pierre_accounts) >= 1 and len(pierre_categories) >= 3:
            transactions = [
                {
                    "amount": 1500.00,
                    "description": "Mission freelance développement",
                    "date": "2024-08-02",
                    "category": pierre_categories[2],  # Revenus freelance
                    "account": pierre_accounts[0],
                    "payee": "StartupTech SAS",
                    
                    "tags": [pierre_tags[0]] if len(pierre_tags) >= 1 else [],
                    "notes": "Développement application mobile",
                    "user": user_id
                },
                {
                    "amount": -65.00,
                    "description": "Plein d'essence",
                    "date": "2024-08-03",
                    "category": pierre_categories[0],  # Transport
                    "account": pierre_accounts[0],
                    "payee": "Total Energies",
                    "location": "Station Total A6",
                    
                    "user": user_id
                },
                {
                    "amount": -25.99,
                    "description": "Abonnement Netflix",
                    "date": "2024-08-05",
                    "category": pierre_categories[1],  # Loisirs
                    "account": pierre_accounts[0],
                    "payee": "Netflix",
                    
                    "is_recurring": True,
                    "tags": [pierre_tags[1]] if len(pierre_tags) >= 2 else [],
                    "user": user_id
                },
                {
                    "amount": -120.00,
                    "description": "Sortie restaurant avec amis",
                    "date": "2024-08-07",
                    "category": pierre_categories[1],  # Loisirs
                    "account": pierre_accounts[0],
                    "payee": "Restaurant L'Ami Jean",
                    
                    "tags": [pierre_tags[1]] if len(pierre_tags) >= 2 else [],
                    "notes": "Anniversaire Thomas",
                    "user": user_id
                }
            ]
            
            for transaction_data in transactions:
                result = self.make_request('POST', '/transactions/', transaction_data, token)
                if result:
                    self.log(f"Transaction créée: {transaction_data['description']} ({transaction_data['amount']}€)")
                self.wait()
                
        # Budget
        self.log("Création du budget de Pierre")
        if len(pierre_categories) >= 2 and len(pierre_accounts) >= 1:
            budget_data = {
                "name": "Budget Loisirs Août",
                "amount": 300.00,
                "start_date": "2024-08-01",
                "end_date": "2024-08-31",
                "categories": [pierre_categories[1]],  # Loisirs
                "accounts": [pierre_accounts[0]],
                "alert_threshold": 75.0,
                "is_recurring": True,
                "user": user_id
            }
            
            result = self.make_request('POST', '/budgets/', budget_data, token)
            if result:
                self.log(f"Budget créé: {budget_data['name']}")
            self.wait()
            
        # Objectif d'épargne
        self.log("Création de l'objectif d'épargne de Pierre")
        if len(pierre_accounts) >= 2:
            savings_goal_data = {
                "name": "Nouveau MacBook Pro",
                "target_amount": 2500.00,
                "current_amount": 800.00,
                "deadline": "2024-12-15",
                "icon": "💻",
                "account": pierre_accounts[1],  # PEL
                "auto_save": True,
                "auto_save_amount": 150.00,
                "auto_save_frequency": "monthly",
                "notes": "Pour le travail freelance",
                "user": user_id
            }
            
            result = self.make_request('POST', '/savings-goals/', savings_goal_data, token)
            if result:
                self.log(f"Objectif d'épargne créé: {savings_goal_data['name']}")
            self.wait()
            
        # Suivi de dette
        self.log("Création du suivi de dette de Pierre")
        if len(pierre_accounts) >= 1:
            debt_data = {
                "name": "Prêt étudiant",
                "total_amount": 15000.00,
                "remaining_amount": 8500.00,
                "interest_rate": 2.5,
                "minimum_payment": 180.00,
                "payment_due_date": "2024-08-15",
                "lender": "Banque Populaire",
                "account": pierre_accounts[0],
                "user": user_id
            }
            
            result = self.make_request('POST', '/debt-trackers/', debt_data, token)
            if result:
                self.log(f"Suivi de dette créé: {debt_data['name']}")
            self.wait()
            
        # Défi
        self.log("Création du défi de Pierre")
        if len(pierre_categories) >= 2:
            challenge_data = {
                "name": "Économiser 500€ en 3 mois",
                "description": "Réduire les dépenses de loisirs pour économiser",
                "start_date": "2024-08-01",
                "end_date": "2024-10-31",
                "target_value": 500.00,
                "current_value": 50.00,
                "challenge_type": "savings",
                "category": pierre_categories[1],  # Loisirs
                "is_completed": False,
                "user": user_id
            }
            
            result = self.make_request('POST', '/challenges/', challenge_data, token)
            if result:
                self.log(f"Défi créé: {challenge_data['name']}")
            self.wait()
            
    def populate_all_data(self):
        """Exécuter le processus complet de création des données"""
        try:
            self.log("🚀 Début de la création des données fictives ZenSpend")
            
            # Étape 1: Créer les utilisateurs
            self.create_users()
            self.wait(2)  # Attendre un peu plus longtemps
            
            # Étape 2: Se connecter pour récupérer les tokens
            self.login_users()
            self.wait(1)
            
            # Étape 3: Créer les données de Marie
            self.create_marie_data()
            self.wait(1)
            
            # Étape 4: Créer les données de Pierre
            self.create_pierre_data()
            
            self.log("✅ Création des données fictives terminée avec succès!")
            self.log(f"📊 Résumé des utilisateurs créés:")
            
            for name, data in self.user_data.items():
                self.log(f"  - {name.title()}: {len(data.get('accounts', []))} comptes, "
                        f"{len(data.get('categories', []))} catégories, "
                        f"{len(data.get('tags', []))} tags")
                        
        except Exception as e:
            self.log(f"❌ Erreur durante la création des données: {e}", "ERROR")
            raise
            
    def cleanup_data(self):
        """Nettoyer les données (optionnel)"""
        self.log("🧹 Nettoyage des données... (à implémenter si nécessaire)")
        # Ici vous pourriez ajouter la logique pour supprimer les données de test


def main():
    parser = argparse.ArgumentParser(description='Populate ZenSpend with test data')
    parser.add_argument('--base-url', default='http://localhost:8000',
                       help='Base URL of the ZenSpend API (default: http://localhost:8000)')
    parser.add_argument('--cleanup', action='store_true',
                       help='Clean up test data instead of creating it')
    
    args = parser.parse_args()
    
    populator = ZenSpendDataPopulator(args.base_url)
    
    if args.cleanup:
        populator.cleanup_data()
    else:
        populator.populate_all_data()


if __name__ == "__main__":
    main()