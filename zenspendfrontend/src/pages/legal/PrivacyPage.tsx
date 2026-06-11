import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const PrivacyPage: React.FC = () => {
  return (
    <LegalPageLayout title="Politique de Confidentialité" lastUpdated="7 juin 2026">
      <p>
        La présente politique décrit comment ZenSpend collecte, utilise et protège vos données
        personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).
      </p>

      <h2>1. Données collectées</h2>
      <p>
        Nous collectons les données que vous nous fournissez (nom, adresse e-mail, devise préférée)
        ainsi que les données financières que vous saisissez (comptes, transactions, budgets,
        objectifs). Des données techniques minimales peuvent être collectées pour assurer le bon
        fonctionnement du Service.
      </p>

      <h2>2. Finalités</h2>
      <p>
        Vos données sont traitées pour fournir le Service, gérer votre compte, afficher vos
        analyses financières, vous adresser des notifications utiles et améliorer l'application.
      </p>

      <h2>3. Base légale</h2>
      <p>
        Le traitement repose sur l'exécution du contrat (fourniture du Service), votre consentement
        pour certaines fonctionnalités, et notre intérêt légitime à sécuriser et améliorer le Service.
      </p>

      <h2>4. Conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. À la suppression du compte,
        elles sont effacées ou anonymisées dans un délai raisonnable, sauf obligation légale contraire.
      </p>

      <h2>5. Partage</h2>
      <p>
        Nous ne vendons pas vos données. Elles peuvent être traitées par des sous-traitants
        techniques (hébergement, envoi d'e-mails) agissant pour notre compte et soumis à des
        obligations de confidentialité.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et
        d'opposition. Pour les exercer, contactez{' '}
        <a href="mailto:privacy@zenspend.local">privacy@zenspend.local</a>. Vous pouvez également
        introduire une réclamation auprès de l'autorité de contrôle compétente (en France, la CNIL).
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement
        des échanges, contrôle d'accès) pour protéger vos données.
      </p>
    </LegalPageLayout>
  );
};

export default PrivacyPage;
