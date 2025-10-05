import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Shield, Clock, X } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  message: string;
  location: string;
  timestamp: string;
  expires?: string;
}

interface AlertsPanelProps {
  location: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ location }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [location]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/alerts/${location}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      // Mock alerts for demo
      setAlerts([
        {
          id: '1',
          type: 'air_quality',
          severity: 'moderate',
          title: 'Moderate Air Quality Alert',
          message: 'Air quality is moderate. Sensitive individuals should consider reducing prolonged outdoor activities.',
          location: location,
          timestamp: new Date().toISOString(),
          expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'weather',
          severity: 'low',
          title: 'High UV Index Warning',
          message: 'UV index is high today. Wear sunscreen and protective clothing when outdoors.',
          location: location,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          badge: 'bg-red-600 text-white'
        };
      case 'high':
        return {
          color: 'bg-orange-100 border-orange-300 text-orange-800',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          badge: 'bg-orange-600 text-white'
        };
      case 'moderate':
        return {
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          icon: <Info className="w-5 h-5 text-yellow-600" />,
          badge: 'bg-yellow-600 text-white'
        };
      case 'low':
        return {
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          badge: 'bg-blue-600 text-white'
        };
      default:
        return {
          color: 'bg-gray-100 border-gray-300 text-gray-800',
          icon: <Info className="w-5 h-5 text-gray-600" />,
          badge: 'bg-gray-600 text-white'
        };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getExpiresIn = (expires: string) => {
    const now = new Date();
    const expiryTime = new Date(expires);
    const diffMinutes = Math.floor((expiryTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Expired';
    if (diffMinutes < 60) return `${diffMinutes}m left`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h left`;
    return `${Math.floor(diffHours / 24)}d left`;
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-700 font-medium">No Active Alerts</p>
        <p className="text-sm text-gray-600 mt-1">Air quality conditions are normal</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const config = getSeverityConfig(alert.severity);
        return (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${config.color}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {config.icon}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <h4 className="font-semibold mb-2">{alert.title}</h4>
            <p className="text-sm mb-3">{alert.message}</p>
            
            <div className="flex items-center justify-between text-xs opacity-75">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(alert.timestamp)}</span>
              </div>
              {alert.expires && (
                <span>{getExpiresIn(alert.expires)}</span>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Health Recommendations */}
      {alerts.some(alert => alert.type === 'air_quality') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Health Recommendations
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Consider reducing outdoor activities</li>
            <li>• Keep windows closed if air quality is poor</li>
            <li>• Use air purifiers indoors if available</li>
            <li>• Sensitive individuals should stay indoors</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
