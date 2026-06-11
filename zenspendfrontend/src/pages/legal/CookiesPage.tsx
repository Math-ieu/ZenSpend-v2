import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const CookiesPage: React.FC = () => {
  return (
    <LegalPageLayout title="Politique relative aux Cookies" lastUpdated="7 juin 2026">
      <p>
        Cette page explique comment ZenSpend utilise les cookies et technologies similaires
        (stockage local du navigateur) lors de votre utilisation du Service.
      </p>

      <h2>1. Cookies strictement nécessaires</h2>
      <p>
        Ces éléments sont indispensables au fonctionnement du Service : ils permettent de vous
        authentifier et de mémoriser votre session, votre devise et votre thème. Ils ne peuvent
        pas être désactivés sans dégrader le Service.
      </p>

      <h2>2. Cookies de préférence</h2>
      <p>
        Nous conservons localement certaines préférences (thème clair/sombre, segment, devise)
        afin de personnaliser votre expérience. Ces informations restent sur votre appareil.
      </p>

      <h2>3. Mesure d'audience</h2>
      <p>
        Si des outils de mesure d'audience sont activés, ils sont utilisés de manière agrégée pour
        comprendre l'usage du Service et l'améliorer. Le cas échéant, votre consentement est recueilli.
      </p>

      <h2>4. Gestion des cookies</h2>
      <p>
        Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les cookies.
        La suppression des cookies nécessaires vous déconnectera du Service.
      </p>

      <h2>5. Contact</h2>
      <p>
        Pour toute question, écrivez-nous à{' '}
        <a href="mailto:privacy@zenspend.local">privacy@zenspend.local</a>.
      </p>
    </LegalPageLayout>
  );
};

export default CookiesPage;
