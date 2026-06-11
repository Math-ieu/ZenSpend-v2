import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../lib/config';

const SSOCallback: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const completeLogin = async () => {
      const error = params.get('error');
      if (error) {
        setErrorMessage(error);
        setIsLoading(false);
        return;
      }

      const access = params.get('access');
      const refresh = params.get('refresh');
      const nextPath = params.get('next') || '/dashboard';

      if (!access) {
        setErrorMessage('Reponse SSO invalide.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/profile/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        if (!response.ok) {
          throw new Error('Impossible de charger le profil utilisateur.');
        }

        const user = await response.json();

        localStorage.setItem('token', access);
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Connexion SSO reussie.');
        navigate(nextPath, { replace: true });
      } catch (error: any) {
        setErrorMessage(error?.message || 'Echec de la connexion SSO.');
      } finally {
        setIsLoading(false);
      }
    };

    completeLogin();
  }, [navigate, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-surface rounded-lg shadow p-6 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Connexion en cours</h1>
          <p className="text-sm text-muted">Validation de votre authentification SSO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-surface rounded-lg shadow p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">Connexion SSO indisponible</h1>
        <p className="text-sm text-muted mb-4">{errorMessage || 'Une erreur inconnue est survenue.'}</p>
        <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
          Retourner a la page de connexion
        </Link>
      </div>
    </div>
  );
};

export default SSOCallback;
