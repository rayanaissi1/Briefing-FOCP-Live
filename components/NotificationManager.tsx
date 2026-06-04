import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellPlus } from 'lucide-react';

const NotificationManager: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return;

        const requestedPermission = await Notification.requestPermission();
        setPermission(requestedPermission);
    };

    const getIcon = () => {
        switch (permission) {
            case 'granted':
                return <Bell className="w-5 h-5 text-green-600" />;
            case 'denied':
                return <BellOff className="w-5 h-5 text-red-600" />;
            case 'default':
            default:
                return <BellPlus className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTooltip = () => {
        switch (permission) {
            case 'granted':
                return "Notifications activées";
            case 'denied':
                return "Notifications bloquées. Modifiez les paramètres de votre navigateur pour les autoriser.";
            case 'default':
            default:
                return "Cliquer pour activer les notifications";
        }
    };
    
    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={requestPermission}
            disabled={permission === 'denied'}
            className="p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors relative group"
            aria-label={getTooltip()}
        >
            {getIcon()}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {getTooltip()}
            </div>
        </button>
    );
};

export default NotificationManager;
