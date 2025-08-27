import React, { useState } from 'react';
import { User, Bell, Lock, Palette, Download, Mail, Phone, Globe } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { useUserStore } from '../../store/useUserStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { preferences, updatePreferences } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.first_name|| '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    language: preferences.language,
    currency: user?.preferred_currency || 'EUR',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
    marketing: false,
  });

  const handlePersonalInfoUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Update personal info logic here
  };

  const handleNotificationUpdate = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center mb-8">
          <Avatar 
            src={user?.avatar}
            name={user?.first_name + ' ' + user?.last_name}
            size="lg"
            className="mr-4"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Paramètres du profil</h1>
            <p className="text-muted">Gérez vos informations personnelles et préférences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Informations personnelles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePersonalInfoUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">Nom complet</label>
                    <input
                      type="text"
                      id="name"
                      className="input"
                      value={user?.first_name + ' ' + user?.last_name}
                      onChange={e => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="label">Adresse e-mail</label>
                    <input
                      type="email"
                      id="email"
                      className="input"
                      value={personalInfo.email}
                      onChange={e => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="label">Téléphone</label>
                    <input
                      type="tel"
                      id="phone"
                      className="input"
                      value={personalInfo.phone}
                      onChange={e => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="language" className="label">Langue</label>
                      <select
                        id="language"
                        className="input"
                        value={personalInfo.language}
                        onChange={e => setPersonalInfo(prev => ({ ...prev, language: e.target.value as 'fr' | 'en' }))}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="currency" className="label">Devise</label>
                      <select
                        id="currency"
                        className="input"
                        value={personalInfo.currency}
                        onChange={e => setPersonalInfo(prev => ({ ...prev, currency: e.target.value }))}
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full md:w-auto">
                    Sauvegarder les modifications
                  
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Notifications par e-mail</p>
                      <p className="text-sm text-muted">Recevez des mises à jour par e-mail</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.email}
                        onChange={() => handleNotificationUpdate('email')}
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Notifications push</p>
                      <p className="text-sm text-muted">Recevez des notifications sur votre appareil</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.push}
                        onChange={() => handleNotificationUpdate('push')}
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Résumé hebdomadaire</p>
                      <p className="text-sm text-muted">Recevez un résumé de vos finances chaque semaine</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.weekly}
                        onChange={() => handleNotificationUpdate('weekly')}
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Settings */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter mes données
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-error hover:text-error">
                    Supprimer mon compte
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Palette className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Apparence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Mode sombre</p>
                      <p className="text-sm text-muted">Basculer entre les thèmes clair et sombre</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services connectés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-muted mr-3" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Google</p>
                        <p className="text-xs text-muted">Connecté</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Déconnecter
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-muted mr-3" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Apple</p>
                        <p className="text-xs text-muted">Non connecté</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Connecter
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-muted mr-3" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Facebook</p>
                        <p className="text-xs text-muted">Non connecté</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Connecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;