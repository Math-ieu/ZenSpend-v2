import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useUserStore } from '../../store/useUserStore';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signup } = useUserStore();
  const navigate = useNavigate();
  
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return { minLength, hasUppercase, hasLowercase, hasNumber };
  };
  
  const passwordChecks = validatePassword(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const doPasswordsMatch = password === confirmPassword;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isPasswordValid) {
      setError('Votre mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    
    if (!doPasswordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError("Une erreur s'est produite lors de l'inscription. Veuillez réessayer.");
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
          Créez votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Ou{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            connectez-vous à votre compte existant
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
              <label htmlFor="name" className="label">
                Nom complet
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="Sophie Martin"
                />
              </div>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="votre@email.com"
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
                  autoComplete="new-password"
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
              
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordChecks.minLength ? 'text-success' : 'text-muted'}`}>
                    {passwordChecks.minLength ? <CheckCircle className="h-3 w-3" /> : '○'}
                  </span>
                  <span className={passwordChecks.minLength ? 'text-success' : 'text-muted'}>
                    Au moins 8 caractères
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordChecks.hasUppercase ? 'text-success' : 'text-muted'}`}>
                    {passwordChecks.hasUppercase ? <CheckCircle className="h-3 w-3" /> : '○'}
                  </span>
                  <span className={passwordChecks.hasUppercase ? 'text-success' : 'text-muted'}>
                    Au moins une majuscule
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordChecks.hasLowercase ? 'text-success' : 'text-muted'}`}>
                    {passwordChecks.hasLowercase ? <CheckCircle className="h-3 w-3" /> : '○'}
                  </span>
                  <span className={passwordChecks.hasLowercase ? 'text-success' : 'text-muted'}>
                    Au moins une minuscule
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordChecks.hasNumber ? 'text-success' : 'text-muted'}`}>
                    {passwordChecks.hasNumber ? <CheckCircle className="h-3 w-3" /> : '○'}
                  </span>
                  <span className={passwordChecks.hasNumber ? 'text-success' : 'text-muted'}>
                    Au moins un chiffre
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="label">
                Confirmez le mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input pl-10 ${
                    confirmPassword && !doPasswordsMatch ? 'border-error focus:ring-error focus:border-error' : ''
                  }`}
                />
              </div>
              {confirmPassword && !doPasswordsMatch && (
                <p className="mt-1 text-xs text-error">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-foreground">
                J'accepte les{' '}
                <a href="#" className="text-primary hover:text-primary-dark">
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="text-primary hover:text-primary-dark">
                  politique de confidentialité
                </a>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                disabled={!isPasswordValid || !doPasswordsMatch}
              >
                Créer un compte
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-muted">Ou s'inscrire avec</span>
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

export default Signup;