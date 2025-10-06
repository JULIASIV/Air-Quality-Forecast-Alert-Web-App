import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  persistent?: boolean;
  location?: string;
  aqi?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onClearAll?: () => void;
  maxNotifications?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemoveNotification,
  onClearAll,
  maxNotifications = 5
}) => {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-remove non-persistent notifications after their duration
    notifications.forEach(notification => {
      if (!notification.persistent && notification.duration) {
        const timer = setTimeout(() => {
          onRemoveNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemoveNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const visibleNotifications = notifications
    .filter(n => !dismissedNotifications.has(n.id))
    .slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {/* Clear All Button */}
      {visibleNotifications.length > 1 && onClearAll && (
        <div className="flex justify-end">
          <button
            onClick={onClearAll}
            className="text-xs px-3 py-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            Clear All ({visibleNotifications.length})
          </button>
        </div>
      )}

      {/* Notifications */}
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`${getColorClasses(notification.type)} border rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`mt-0.5 ${getIconColorClasses(notification.type)}`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">
                  {notification.title}
                </div>
                <div className="text-sm opacity-90 mb-2">
                  {notification.message}
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center justify-between text-xs opacity-70">
                  <div className="flex items-center space-x-3">
                    {notification.location && (
                      <span>📍 {notification.location}</span>
                    )}
                    {notification.aqi && (
                      <span>AQI: {notification.aqi}</span>
                    )}
                  </div>
                  <span>{notification.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onRemoveNotification(notification.id)}
              className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar for Timed Notifications */}
          {!notification.persistent && notification.duration && (
            <div className="mt-3 w-full bg-white bg-opacity-30 rounded-full h-1">
              <div
                className="bg-current h-1 rounded-full animate-progress-bar"
                style={{
                  animationDuration: `${notification.duration}ms`
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Notification Counter */}
      {notifications.length > maxNotifications && (
        <div className="text-center">
          <div className="inline-block bg-gray-600 text-white text-xs px-3 py-1 rounded-full">
            +{notifications.length - maxNotifications} more notifications
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using the notification system
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      duration: notification.duration || 5000, // Default 5 seconds
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Predefined notification helpers
  const notifyAQIAlert = (location: string, aqi: number, category: string) => {
    const type: 'warning' | 'error' = aqi > 150 ? 'error' : 'warning';
    addNotification({
      type,
      title: `Air Quality Alert!`,
      message: `${category} air quality detected in ${location}`,
      location,
      aqi,
      persistent: true
    });
  };

  const notifyHealthRecommendation = (location: string, recommendation: string) => {
    addNotification({
      type: 'info',
      title: 'Health Recommendation',
      message: recommendation,
      location,
      duration: 8000
    });
  };

  const notifyDataUpdate = (location: string) => {
    addNotification({
      type: 'success',
      title: 'Data Updated',
      message: `Fresh air quality data available for ${location}`,
      location,
      duration: 3000
    });
  };

  const notifyPredictionAlert = (location: string, prediction: string) => {
    addNotification({
      type: 'warning',
      title: 'Air Quality Forecast',
      message: prediction,
      location,
      duration: 10000
    });
  };

  const notifySystemStatus = (message: string, type: 'success' | 'error' = 'info') => {
    addNotification({
      type,
      title: 'System Status',
      message,
      duration: 4000
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    // Helper functions
    notifyAQIAlert,
    notifyHealthRecommendation,
    notifyDataUpdate,
    notifyPredictionAlert,
    notifySystemStatus
  };
};

// Custom CSS (add to your global styles)
const notificationStyles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes progress-bar {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-progress-bar {
    animation: progress-bar linear;
  }
`;

export { NotificationSystem, notificationStyles };
export default NotificationSystem;
