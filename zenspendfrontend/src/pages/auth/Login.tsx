import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useUserStore } from '../../store/useUserStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useUserStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // For demo: use sophie.martin@example.com with any password
      if (email && password) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        setError('Veuillez remplir tous les champs.');
      }
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center text-primary">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Retour à l'accueil</span>
        </Link>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Connectez-vous à votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Ou{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-primary-dark">
            créez un nouveau compte
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-error/10 text-error text-sm">
              {error}
            </div>
          )}
          
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-background text-sm font-medium text-foreground hover:bg-surface"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.1646 8.89345C13.4729 8.89345 14.3459 8.16677 14.8579 7.67468L16.3674 9.14677C15.5181 10.0198 14.0323 11.02 12.1646 11.02C9.53127 11.02 7.38293 8.9053 7.38293 6.25359C7.38293 3.60187 9.53127 1.48715 12.1646 1.48715C14.0559 1.48715 15.5073 2.4874 16.3213 3.32855L14.8354 4.82365C14.3342 4.33156 13.4846 3.6049 12.1646 3.6049C10.7275 3.6049 9.50527 4.80766 9.50527 6.25359C9.50527 7.69951 10.7275 8.89345 12.1646 8.89345ZM19.5637 8.60596V6.75531H18V6.75531V5.25531V5.25531H19.5637V3.40471H21.0637V5.25531H23V6.75531H21.0637V8.60596H19.5637ZM17.5 17.5V14H2.5V17.5H17.5ZM18.75 14C18.75 13.31 18.19 12.75 17.5 12.75H2.5C1.81 12.75 1.25 13.31 1.25 14V17.5C1.25 18.19 1.81 18.75 2.5 18.75H17.5C18.19 18.75 18.75 18.19 18.75 17.5V14Z" fill="currentColor"/>
                </svg>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-background text-sm font-medium text-foreground hover:bg-surface"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.675 0H1.325C0.593 0 0 0.593 0 1.325V22.676C0 23.407 0.593 24 1.325 24H12.82V14.706H9.692V11.084H12.82V8.413C12.82 5.313 14.713 3.625 17.479 3.625C18.804 3.625 19.942 3.724 20.274 3.768V7.008H18.356C16.852 7.008 16.561 7.727 16.561 8.772V11.085H20.148L19.681 14.707H16.561V24H22.677C23.407 24 24 23.407 24 22.675V1.325C24 0.593 23.407 0 22.675 0Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;