import React, { useEffect, useState } from 'react';
import { User, Bell, Lock, Palette, Download, Mail, Phone, Globe, Users, UserPlus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { useUserStore } from '../../store/useUserStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useUserSegment, USER_SEGMENT_OPTIONS } from '../../hooks/useUserSegment';
import { Household, HouseholdMember, HouseholdRole, UserSegment } from '../../types';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { preferences } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const {
    user,
    updateCurrentUser,
    fetchHouseholds,
    createHousehold,
    fetchHouseholdMembers,
    addHouseholdMember,
    updateHouseholdMember,
    removeHouseholdMember,
  } = useAuth();
  const { segment, setSegment } = useUserSegment();
  const [isSavingSegment, setIsSavingSegment] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<number | null>(null);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HouseholdRole>('child');
  const [isHouseholdLoading, setIsHouseholdLoading] = useState(false);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  
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

  const handleSegmentChange = async (nextSegment: UserSegment) => {
    const previousSegment = segment;
    setSegment(nextSegment);

    try {
      setIsSavingSegment(true);
      await updateCurrentUser({ user_segment: nextSegment });
      toast.success('Espace utilisateur mis a jour.');
    } catch (error: any) {
      setSegment(previousSegment);
      toast.error(error?.message || 'Impossible de sauvegarder cet espace utilisateur.');
    } finally {
      setIsSavingSegment(false);
    }
  };

  const roleLabels: Record<HouseholdRole, string> = {
    owner: 'Proprietaire',
    parent: 'Parent',
    partner: 'Partenaire',
    child: 'Enfant',
  };

  const loadHouseholds = async () => {
    try {
      setIsHouseholdLoading(true);
      const fetchedHouseholds = await fetchHouseholds();
      setHouseholds(fetchedHouseholds);

      if (fetchedHouseholds.length > 0) {
        setActiveHouseholdId((prev) => prev ?? fetchedHouseholds[0].id);
      } else {
        setActiveHouseholdId(null);
        setMembers([]);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de charger les foyers.');
    } finally {
      setIsHouseholdLoading(false);
    }
  };

  const loadMembers = async (householdId: number) => {
    try {
      const fetchedMembers = await fetchHouseholdMembers(householdId);
      setMembers(fetchedMembers);
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de charger les membres du foyer.');
    }
  };

  useEffect(() => {
    if (segment === 'families' && user) {
      loadHouseholds();
    }
  }, [segment, user]);

  useEffect(() => {
    if (segment === 'families' && activeHouseholdId) {
      loadMembers(activeHouseholdId);
    }
  }, [segment, activeHouseholdId]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHouseholdName.trim();

    if (!name) {
      toast.error('Saisissez un nom de foyer.');
      return;
    }

    try {
      setIsCreatingHousehold(true);
      const createdHousehold = await createHousehold({
        name,
        description: 'Foyer multi-profils',
        currency: personalInfo.currency,
      });

      setHouseholds((prev) => [createdHousehold, ...prev]);
      setActiveHouseholdId(createdHousehold.id);
      setNewHouseholdName('');
      toast.success('Foyer cree.');
      await loadMembers(createdHousehold.id);
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de creer le foyer.');
    } finally {
      setIsCreatingHousehold(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouseholdId) {
      toast.error('Creez ou selectionnez un foyer.');
      return;
    }

    const email = inviteEmail.trim();
    if (!email) {
      toast.error('Renseignez un email membre.');
      return;
    }

    try {
      setIsInvitingMember(true);
      await addHouseholdMember(activeHouseholdId, {
        email,
        role: inviteRole,
      });
      setInviteEmail('');
      toast.success('Membre ajoute au foyer.');
      await loadMembers(activeHouseholdId);
      await loadHouseholds();
    } catch (error: any) {
      toast.error(error?.message || 'Impossible d ajouter le membre.');
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleChangeMemberRole = async (memberId: number, nextRole: HouseholdRole) => {
    if (!activeHouseholdId) {
      return;
    }

    try {
      await updateHouseholdMember(activeHouseholdId, memberId, { role: nextRole });
      setMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role: nextRole } : member)));
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de modifier le role du membre.');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!activeHouseholdId) {
      return;
    }

    try {
      await removeHouseholdMember(activeHouseholdId, memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.success('Membre retire du foyer.');
      await loadHouseholds();
    } catch (error: any) {
      toast.error(error?.message || 'Impossible de retirer ce membre.');
    }
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
            <Card>
              <CardHeader>
                <CardTitle>Profil financier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Personnalisez ZenSpend selon votre usage principal.
                  </p>
                  <select
                    className="input"
                    value={segment}
                    onChange={(e) => handleSegmentChange(e.target.value as UserSegment)}
                    disabled={isSavingSegment}
                  >
                    {USER_SEGMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted">
                    Ce mode ajuste les recommandations sur le tableau de bord: couples, jeunes actifs ou familles.
                  </p>
                </div>
              </CardContent>
            </Card>

            {segment === 'families' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <CardTitle>Foyer multi-profils</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted">
                      Structurez votre foyer avec des roles (parent, partenaire, enfant) pour piloter plusieurs profils.
                    </p>

                    <form onSubmit={handleCreateHousehold} className="space-y-2">
                      <input
                        className="input"
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                        placeholder="Nom du foyer"
                      />
                      <Button type="submit" variant="outline" className="w-full" isLoading={isCreatingHousehold}>
                        Creer un foyer
                      </Button>
                    </form>

                    {isHouseholdLoading ? (
                      <p className="text-sm text-muted">Chargement des foyers...</p>
                    ) : households.length === 0 ? (
                      <p className="text-sm text-muted">Aucun foyer pour le moment.</p>
                    ) : (
                      <select
                        className="input"
                        value={activeHouseholdId ?? ''}
                        onChange={(e) => setActiveHouseholdId(Number(e.target.value))}
                      >
                        {households.map((household) => (
                          <option key={household.id} value={household.id}>
                            {household.name} ({household.members_count} membre(s))
                          </option>
                        ))}
                      </select>
                    )}

                    {activeHouseholdId && (
                      <>
                        <form onSubmit={handleInviteMember} className="space-y-2">
                          <input
                            className="input"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Email du membre"
                          />
                          <select
                            className="input"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as HouseholdRole)}
                          >
                            {Object.entries(roleLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" className="w-full" leftIcon={<UserPlus className="h-4 w-4" />} isLoading={isInvitingMember}>
                            Ajouter un membre
                          </Button>
                        </form>

                        <div className="space-y-2">
                          {members.map((member) => (
                            <div key={member.id} className="rounded-md border border-border/60 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{member.user_full_name || member.user_email}</p>
                                  <p className="text-xs text-muted">{member.user_email}</p>
                                </div>
                                {member.role !== 'owner' && (
                                  <button
                                    type="button"
                                    className="text-error hover:text-error/80"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <select
                                className="input mt-2"
                                value={member.role}
                                onChange={(e) => handleChangeMemberRole(member.id, e.target.value as HouseholdRole)}
                                disabled={member.role === 'owner'}
                              >
                                {Object.entries(roleLabels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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