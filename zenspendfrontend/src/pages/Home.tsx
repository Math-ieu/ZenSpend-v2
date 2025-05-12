import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, CreditCard, PieChart, BarChart3, Target, Shield, User } from 'lucide-react';
import Button from '../components/ui/Button';

const Home: React.FC = () => {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                Prenez le contrôle de <span className="text-primary">vos finances</span>
              </h1>
              <p className="text-xl text-muted mb-8 md:pr-8">
                ZenSpend vous aide à gérer vos dépenses, atteindre vos objectifs d'épargne et planifier votre avenir financier en toute sérénité.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/signup">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0">
              <img 
                src="https://images.pexels.com/photos/7605933/pexels-photo-7605933.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="ZenSpend Dashboard" 
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-surface">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Fonctionnalités principales</h2>
            <p className="text-lg text-muted max-w-3xl mx-auto">
              ZenSpend vous offre tous les outils dont vous avez besoin pour gérer votre argent intelligemment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Suivi des dépenses</h3>
              <p className="text-muted">
                Suivez facilement toutes vos transactions et catégorisez automatiquement vos dépenses pour voir où va votre argent.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Budgets personnalisés</h3>
              <p className="text-muted">
                Créez des budgets flexibles par catégorie et recevez des alertes lorsque vous approchez de vos limites.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Objectifs d'épargne</h3>
              <p className="text-muted">
                Définissez des objectifs d'épargne concrets et suivez votre progression pour les atteindre plus rapidement.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Rapports détaillés</h3>
              <p className="text-muted">
                Obtenez des analyses visuelles de vos habitudes financières pour prendre de meilleures décisions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Sécurité avancée</h3>
              <p className="text-muted">
                Vos données financières sont protégées par un chiffrement de niveau bancaire et des connexions sécurisées.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-background rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Multiplateforme</h3>
              <p className="text-muted">
                Accédez à ZenSpend depuis n'importe quel appareil avec une synchronisation automatique de vos données.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ce que disent nos utilisateurs</h2>
            <p className="text-lg text-muted max-w-3xl mx-auto">
              Des milliers de personnes utilisent ZenSpend pour améliorer leur vie financière.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-surface rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100" 
                  alt="Thomas D." 
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="text-foreground font-semibold">Thomas D.</h4>
                  <p className="text-muted text-sm">Entrepreneur</p>
                </div>
              </div>
              <p className="text-foreground italic">
                "ZenSpend m'a permis de visualiser clairement où allait mon argent. J'ai pu économiser plus de 200€ par mois simplement en prenant conscience de mes dépenses superflues."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-surface rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100" 
                  alt="Marie L." 
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="text-foreground font-semibold">Marie L.</h4>
                  <p className="text-muted text-sm">Ingénieure</p>
                </div>
              </div>
              <p className="text-foreground italic">
                "Grâce à la fonction d'objectifs d'épargne, j'ai pu financer mes vacances de rêve en seulement 6 mois. L'application est intuitive et m'a vraiment aidée à rester motivée."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-surface rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100" 
                  alt="Lucas M." 
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="text-foreground font-semibold">Lucas M.</h4>
                  <p className="text-muted text-sm">Étudiant</p>
                </div>
              </div>
              <p className="text-foreground italic">
                "En tant qu'étudiant avec un budget serré, ZenSpend a été une révélation. Les alertes budgétaires m'ont évité plusieurs découverts et l'interface est super intuitive."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-surface">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Questions fréquentes</h2>
            <p className="text-lg text-muted max-w-3xl mx-auto">
              Tout ce que vous devez savoir sur ZenSpend.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* FAQ Item 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground mb-2">Est-ce que ZenSpend est gratuit ?</h3>
              <p className="text-muted">
                ZenSpend propose une version gratuite avec des fonctionnalités essentielles. Pour des fonctionnalités avancées comme les prévisions financières ou les rapports personnalisés, nous proposons un abonnement premium à partir de 4,99€ par mois.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground mb-2">Mes données bancaires sont-elles sécurisées ?</h3>
              <p className="text-muted">
                Absolument. Nous utilisons un chiffrement de niveau bancaire (256-bit AES) et nous ne stockons jamais vos identifiants bancaires. Nous respectons également toutes les réglementations RGPD en vigueur.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground mb-2">Comment importer mes transactions ?</h3>
              <p className="text-muted">
                ZenSpend vous permet d'importer vos transactions de plusieurs façons : connexion sécurisée à votre banque (via des API sécurisées), importation de fichiers CSV/Excel, ou saisie manuelle. Vous choisissez la méthode qui vous convient le mieux.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground mb-2">Puis-je gérer plusieurs comptes ?</h3>
              <p className="text-muted">
                Oui, ZenSpend vous permet de gérer tous vos comptes bancaires, cartes de crédit, prêts et investissements au même endroit. Vous pouvez également suivre vos liquidités et autres actifs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Prêt à prendre le contrôle de vos finances ?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui ont déjà transformé leur relation avec l'argent grâce à ZenSpend.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                Créer un compte gratuit
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Se connecter
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex justify-center items-center space-x-4 text-white/90">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Aucune carte de crédit requise</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Annulez à tout moment</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">À propos de ZenSpend</h2>
              <p className="text-muted mb-4">
                ZenSpend a été créé par une équipe passionnée qui croit que la gestion financière devrait être simple, accessible et même agréable.
              </p>
              <p className="text-muted mb-4">
                Notre mission est de donner à chacun les outils et les connaissances nécessaires pour prendre des décisions financières éclairées et atteindre leurs objectifs.
              </p>
              <p className="text-muted">
                Depuis notre lancement en 2023, nous avons aidé plus de 50 000 utilisateurs à économiser plus de 10 millions d'euros collectivement.
              </p>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="L'équipe ZenSpend" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-surface">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Contactez-nous</h2>
            <p className="text-lg text-muted mb-8">
              Des questions, des suggestions ou besoin d'aide ? Notre équipe est là pour vous.
            </p>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="label">Nom</label>
                  <input type="text" id="name" className="input" placeholder="Votre nom" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input type="email" id="email" className="input" placeholder="votre@email.com" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="label">Sujet</label>
                <input type="text" id="subject" className="input" placeholder="Comment pouvons-nous vous aider ?" />
              </div>
              <div>
                <label htmlFor="message" className="label">Message</label>
                <textarea id="message" rows={4} className="input" placeholder="Votre message..."></textarea>
              </div>
              <div>
                <Button size="lg" variant="primary" className="w-full md:w-auto">
                  Envoyer le message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;