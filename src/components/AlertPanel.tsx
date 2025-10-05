import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Bell, Clock, MapPin } from "lucide-react";

interface AlertPanelProps {
  alerts: Array<{
    location: string;
    severity: 'moderate' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

const AlertPanel = ({ alerts }: AlertPanelProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'moderate':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? 
      <AlertTriangle className="w-4 h-4" /> : 
      <Bell className="w-4 h-4" />;
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">
            Active Air Quality Alerts
          </h3>
        </div>
        
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert key={index} className="border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2 text-sm">
                    {getSeverityIcon(alert.severity)}
                    <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {alert.location}
                    </span>
                  </AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    {alert.message}
                  </AlertDescription>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </Alert>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Health Advisory:</strong> Sensitive groups should limit outdoor activities. 
            Consider postponing strenuous outdoor exercise until air quality improves.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AlertPanel;
