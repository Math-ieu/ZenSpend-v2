import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { isUserSegment, useUserSegment } from '../../hooks/useUserSegment';
import {
  getLoginPathForSegment,
  getResetPasswordPathForSegment,
  parseSegmentRouteSlug,
} from '../../lib/segmentRouting';
import { API_BASE_URL } from '../../lib/config';

const ResetPassword: React.FC = () => {
  const { segmentSlug } = useParams<{ segmentSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { segment, setSegment } = useUserSegment();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const routeSegment = parseSegmentRouteSlug(segmentSlug);
  const loginPath = getLoginPathForSegment(segment);

  React.useEffect(() => {
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
      navigate(
        `${getResetPasswordPathForSegment(querySegment)}${location.search ? location.search : ''}`,
        { replace: true }
      );
      return;
    }

    navigate(`${getResetPasswordPathForSegment(segment)}${location.search ? location.search : ''}`, {
      replace: true,
    });
  }, [routeSegment, location.search, navigate, segment, setSegment]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Lien invalide: token manquant.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Impossible de reinitialiser le mot de passe.');
      }

      toast.success('Mot de passe reinitialise. Connectez-vous.');
      navigate(loginPath, { replace: true });
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

        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">Nouveau mot de passe</h2>
        <p className="mt-2 text-center text-sm text-muted">
          Definissez un nouveau mot de passe securise pour votre compte.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!token ? (
            <div className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-foreground">
              Lien invalide: token manquant.
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="newPassword" className="label">
                  Nouveau mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Button type="submit" isLoading={isLoading} className="w-full">
                  Reinitialiser le mot de passe
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
