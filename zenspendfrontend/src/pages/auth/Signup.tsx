import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(''); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('EUR');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
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
    
    if (!isPasswordValid) {
      toast.error('Votre mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    
    if (!doPasswordsMatch) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Adapter les données pour correspondre au serializer Django
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        preferred_currency: preferredCurrency,
        password: password,
        password_confirm: confirmPassword
      };
      
      await signup(userData);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.");
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="lastName" className="label">
                Nom
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input pl-10"
                  placeholder="MARTIN"
                />
              </div>
            </div>

            <div>
              <label htmlFor="firstName" className="label">
                Prénom
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input pl-10"
                  placeholder="Sophie"
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
              <label htmlFor="phoneNumber" className="label">
                Numéro de téléphone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input pl-10"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div>
              <label htmlFor="preferredCurrency" className="label">
                Devise préférée
              </label>
              <div className="mt-1">
                <select
                  id="preferredCurrency"
                  name="preferredCurrency"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="input"
                  required
                >
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar américain (USD)</option>
                  <option value="GBP">Livre sterling (GBP)</option>
                  <option value="CAD">Dollar canadien (CAD)</option>
                  <option value="CHF">Franc suisse (CHF)</option>
                  <option value="JPY">Yen japonais (JPY)</option>
                </select>
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
        </div>
      </div>
    </div>
  );
};

export default Signup;