import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { isUserSegment, useUserSegment } from '../../hooks/useUserSegment';
import {
  getForgotPasswordPathForSegment,
  getLoginPathForSegment,
  parseSegmentRouteSlug,
} from '../../lib/segmentRouting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const ForgotPassword: React.FC = () => {
  const { segmentSlug } = useParams<{ segmentSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { segment, setSegment } = useUserSegment();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const routeSegment = parseSegmentRouteSlug(segmentSlug);
  const loginPath = getLoginPathForSegment(segment);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const querySegment = params.get('segment');

    if (routeSegment) {
      if (routeSegment !== segment) {
        setSegment(routeSegment);
      }
      return;
    }

    if (isUserSegment(querySegment)) {
      if (querySegment !== segment) {
        setSegment(querySegment);
      }
      navigate(getForgotPasswordPathForSegment(querySegment), { replace: true });
      return;
    }

    navigate(getForgotPasswordPathForSegment(segment), { replace: true });
  }, [routeSegment, location.search, navigate, segment, setSegment]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Veuillez renseigner votre email.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          user_segment: segment,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Impossible de lancer la reinitialisation.');
      }

      setResetUrl(data?.reset_url || null);
      setSubmitted(true);
      toast.success('Demande de reinitialisation envoyee.');
    } catch (error: any) {
      toast.error(error?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to={loginPath} className="flex items-center justify-center text-primary">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Retour a la connexion</span>
        </Link>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">Mot de passe oublie</h2>
        <p className="mt-2 text-center text-sm text-muted">
          Saisissez votre email pour recevoir un lien de reinitialisation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="label">
                  Adresse e-mail
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input pl-10"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <Button type="submit" isLoading={isLoading} className="w-full">
                  Envoyer le lien de reinitialisation
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-foreground">
                Si un compte existe avec cet email, un lien de reinitialisation est pret.
              </div>

              {resetUrl && (
                <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground break-words">
                  <p className="font-medium mb-1">Lien de reinitialisation (mode developpement)</p>
                  <a href={resetUrl} className="text-primary hover:text-primary-dark underline">
                    {resetUrl}
                  </a>
                </div>
              )}

              <Link to={loginPath} className="block">
                <Button type="button" variant="outline" className="w-full">
                  Retour a la connexion
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
