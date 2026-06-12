import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../../lib/config';
import LegalPageLayout from './LegalPageLayout';

/**
 * Public account-deletion request page (required by Google Play).
 * Accessible without authentication so that users who can no longer sign in
 * can still request the deletion of their account and data.
 */
const DataDeletionPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: 'Demande de suppression de compte',
          message:
            form.message ||
            `Je demande la suppression de mon compte ZenSpend associé à l'adresse ${form.email}.`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "La demande n'a pas pu être envoyée.");
      }
      toast.success('Demande envoyée. Nous traiterons votre suppression sous 30 jours.');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setIsSending(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-border bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <LegalPageLayout title="Suppression de compte et de données" lastUpdated="12 juin 2026">
      <p>
        Cette page explique comment supprimer votre compte ZenSpend et les données associées.
        ZenSpend est édité par l'équipe ZenSpend.
      </p>

      <h2>1. Depuis l'application</h2>
      <p>
        La méthode la plus rapide : ouvrez l'application, allez dans{' '}
        <strong>Plus → Profil → Zone de danger</strong> et appuyez sur{' '}
        <strong>« Supprimer mon compte »</strong>. Votre compte est immédiatement désactivé.
      </p>

      <h2>2. Par formulaire (si vous ne pouvez plus vous connecter)</h2>
      <p>
        Renseignez l'adresse e-mail de votre compte ci-dessous. Nous vérifierons votre identité
        puis procéderons à la suppression.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 not-prose">
        <div>
          <label htmlFor="del-name" className="block text-sm font-medium text-foreground mb-1">
            Nom
          </label>
          <input
            id="del-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="del-email" className="block text-sm font-medium text-foreground mb-1">
            E-mail du compte
          </label>
          <input
            id="del-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="del-message" className="block text-sm font-medium text-foreground mb-1">
            Message (facultatif)
          </label>
          <textarea
            id="del-message"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={inputClass}
          />
        </div>
        <Button type="submit" variant="primary" isLoading={isSending}>
          Envoyer ma demande de suppression
        </Button>
      </form>

      <h2>3. Données supprimées</h2>
      <p>
        La suppression efface définitivement votre profil (nom, e-mail, téléphone, préférences)
        ainsi que l'ensemble de vos données financières : comptes, transactions, budgets, objectifs,
        dettes et notifications.
      </p>

      <h2>4. Délais et conservation</h2>
      <p>
        Votre compte est désactivé immédiatement (connexion impossible). Les données sont
        définitivement effacées dans un délai de <strong>30 jours</strong>. Certaines données
        peuvent être conservées au-delà uniquement si la loi l'exige (par exemple obligations
        comptables ou fiscales), puis supprimées à l'issue de ce délai légal.
      </p>

      <h2>5. Contact</h2>
      <p>
        Pour toute question relative à vos données, écrivez à{' '}
        <a href="mailto:privacy@zenspend.local">privacy@zenspend.local</a>.
      </p>
    </LegalPageLayout>
  );
};

export default DataDeletionPage;
