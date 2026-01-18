import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const NotificationsPage: React.FC = () => {
    const { fetchNotifications } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            const response = await fetchNotifications();
            setNotifications(response);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Impossible de charger les notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const getIcon = (level: string) => {
        switch (level) {
            case 'info': return <Info size={18} className="text-primary" />;
            case 'success': return <Check size={18} className="text-success" />;
            case 'warning': return <AlertTriangle size={18} className="text-warning" />;
            case 'error': return <AlertCircle size={18} className="text-error" />;
            default: return <Bell size={18} className="text-muted" />;
        }
    };

    if (isLoading) {
        return <div className="py-8 text-center">Chargement...</div>;
    }

    return (
        <div className="py-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Notifications</h1>
                        <p className="text-muted">Restez informé de votre activité financière</p>
                    </div>
                    <Button variant="outline" size="sm">
                        Tout marquer comme lu
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardContent className="p-0">
                            {notifications.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                                        <BellOff size={32} />
                                    </div>
                                    <p className="text-muted font-medium">Vous n'avez pas de notifications.</p>
                                    <p className="text-sm text-muted mt-1">Nous vous tiendrons au courant de vos activités importantes.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-surface">
                                    {notifications.map(notification => (
                                        <div key={notification.id} className={`p-4 flex items-start gap-4 hover:bg-surface/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}>
                                            <div className={`mt-1 p-2 rounded-full ${notification.level === 'info' ? 'bg-primary/10' :
                                                notification.level === 'success' ? 'bg-success/10' :
                                                    notification.level === 'warning' ? 'bg-warning/10' :
                                                        'bg-error/10'
                                                }`}>
                                                {getIcon(notification.level)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className={`text-sm font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-xs text-muted">{new Date(notification.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-muted mt-1">{notification.message}</p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
