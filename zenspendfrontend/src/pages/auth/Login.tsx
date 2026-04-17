import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { isUserSegment, USER_SEGMENT_OPTIONS, useUserSegment } from '../../hooks/useUserSegment';
import {
  getDashboardPathForSegment,
  getForgotPasswordPathForSegment,
  getLoginPathForSegment,
  getSignupPathForSegment,
  parseSegmentRouteSlug,
} from '../../lib/segmentRouting';

const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.31h6.45a5.51 5.51 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.57-5.14 3.57-8.66z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.86-3c-1.07.72-2.44 1.15-4.09 1.15-3.15 0-5.82-2.13-6.78-5H1.23v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.22 14.24A7.2 7.2 0 0 1 4.84 12c0-.78.13-1.53.38-2.24V6.67H1.23A12 12 0 0 0 0 12c0 1.93.46 3.76 1.23 5.33l3.99-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.6 4.58 1.77l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.23 6.67l3.99 3.09c.96-2.87 3.63-4.99 6.78-4.99z"
    />
  </svg>
);

const FacebookLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.67 4.533-4.67 1.313 0 2.686.235 2.686.235v2.953h-1.514c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796V24C19.612 23.103 24 18.146 24 12z"
    />
    <path
      fill="#FFFFFF"
      d="M16.671 15.469L17.203 12h-3.328V9.748c0-.949.465-1.874 1.955-1.874h1.514V4.92s-1.373-.234-2.686-.234c-2.741 0-4.533 1.663-4.533 4.67V12H7.078v3.469h3.047V23.854c.613.097 1.242.146 1.875.146.636 0 1.265-.049 1.875-.146v-8.385h2.796z"
    />
  </svg>
);

const MicrosoftLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" fill="#F25022" />
    <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
    <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
    <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
  </svg>
);

const Login: React.FC = () => {
  const { segmentSlug } = useParams<{ segmentSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { segment, setSegment } = useUserSegment();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const routeSegment = parseSegmentRouteSlug(segmentSlug);

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
      navigate(getLoginPathForSegment(querySegment), { replace: true, state: location.state });
      return;
    }

    navigate(getLoginPathForSegment(segment), { replace: true, state: location.state });
  }, [routeSegment, location.search, location.state, navigate, segment, setSegment]);

  const segmentLabel = useMemo(() => {
    return USER_SEGMENT_OPTIONS.find((option) => option.value === segment)?.label || 'Jeunes actifs';
  }, [segment]);

  const fromPath = location.state?.from?.pathname;
  const signupPath = getSignupPathForSegment(segment);
  const forgotPasswordPath = getForgotPasswordPathForSegment(segment);
  const dashboardPath = getDashboardPathForSegment(segment);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const handleSegmentSelect = (nextSegment: typeof segment) => {
    setSegment(nextSegment);
    navigate(getLoginPathForSegment(nextSegment), { replace: true, state: location.state });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion reussie !');
      navigate(fromPath || dashboardPath, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Identifiants incorrects. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSsoLogin = (provider: 'google' | 'facebook' | 'microsoft') => {
    const nextPath = encodeURIComponent(fromPath || dashboardPath);
    window.location.assign(`${API_BASE_URL}/auth/sso/${provider}/?next=${nextPath}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center text-primary">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Retour a l accueil</span>
        </Link>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">Connectez-vous a votre compte</h2>
        <p className="mt-2 text-center text-sm text-muted">
          Espace actif: <span className="font-medium text-foreground">{segmentLabel}</span>
        </p>
        <p className="mt-1 text-center text-sm text-muted">
          Ou{' '}
          <Link to={signupPath} className="font-medium text-primary hover:text-primary-dark">
            creez un nouveau compte
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="segment" className="label">
                Espace
              </label>
              <select
                id="segment"
                name="segment"
                value={segment}
                onChange={(event) => handleSegmentSelect(event.target.value as typeof segment)}
                className="input"
              >
                {USER_SEGMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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
                  placeholder="sophie.martin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input pl-10 pr-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link to={forgotPasswordPath} className="font-medium text-primary hover:text-primary-dark">
                  Mot de passe oublie ?
                </Link>
              </div>
            </div>

            <div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Se connecter
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-muted">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                leftIcon={<GoogleLogo />}
                onClick={() => handleSsoLogin('google')}
              >
                Continuer avec Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                leftIcon={<FacebookLogo />}
                onClick={() => handleSsoLogin('facebook')}
              >
                Continuer avec Facebook
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                leftIcon={<MicrosoftLogo />}
                onClick={() => handleSsoLogin('microsoft')}
              >
                Continuer avec Microsoft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;