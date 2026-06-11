import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const TermsPage: React.FC = () => {
  return (
    <LegalPageLayout title="Conditions Générales d'Utilisation" lastUpdated="7 juin 2026">
      <p>
        Les présentes Conditions Générales d'Utilisation (« CGU ») encadrent l'accès et
        l'utilisation de l'application ZenSpend (le « Service »). En créant un compte, vous
        acceptez sans réserve les présentes CGU.
      </p>

      <h2>1. Objet du Service</h2>
      <p>
        ZenSpend est un outil de gestion de budget personnel permettant de suivre vos comptes,
        transactions, budgets et objectifs d'épargne. Le Service est fourni à titre informatif
        et ne constitue pas un conseil financier, fiscal ou juridique.
      </p>

      <h2>2. Compte utilisateur</h2>
      <p>
        Vous êtes responsable de l'exactitude des informations fournies et de la confidentialité
        de vos identifiants. Toute activité réalisée depuis votre compte est réputée effectuée
        par vous. Prévenez-nous sans délai en cas d'utilisation non autorisée.
      </p>

      <h2>3. Utilisation acceptable</h2>
      <p>
        Vous vous engagez à ne pas détourner le Service, à ne pas tenter d'y accéder de manière
        frauduleuse et à ne pas porter atteinte à son intégrité ou à celle des autres utilisateurs.
      </p>

      <h2>4. Abonnements</h2>
      <p>
        Certaines fonctionnalités relèvent d'offres payantes. Les conditions tarifaires, la durée
        et les modalités de résiliation sont présentées au moment de la souscription. Vous pouvez
        résilier à tout moment ; l'abonnement reste actif jusqu'à la fin de la période en cours.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        Le Service est fourni « en l'état ». Nous nous efforçons d'assurer sa disponibilité et
        l'exactitude des données, sans garantie d'absence d'interruption ou d'erreur. Notre
        responsabilité ne saurait être engagée pour les décisions financières prises sur la base
        des informations affichées.
      </p>

      <h2>6. Modification des CGU</h2>
      <p>
        Nous pouvons faire évoluer les présentes CGU. Vous serez informé de toute modification
        substantielle. La poursuite de l'utilisation vaut acceptation de la version mise à jour.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU, écrivez-nous à{' '}
        <a href="mailto:contact@zenspend.local">contact@zenspend.local</a>.
      </p>
    </LegalPageLayout>
  );
};

export default TermsPage;
