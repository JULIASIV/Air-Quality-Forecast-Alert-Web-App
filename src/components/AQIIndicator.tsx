import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AQIIndicatorProps {
  value: number;
  location: string;
  pollutant: string;
}

const getAQIDetails = (aqi: number) => {
  if (aqi <= 50) return { 
    level: "Good", 
    color: "hsl(var(--aqi-good))",
    bgColor: "bg-[hsl(var(--aqi-good)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-good)/0.3)]",
    description: "Air quality is satisfactory, and air pollution poses little or no risk." 
  };
  if (aqi <= 100) return { 
    level: "Moderate", 
    color: "hsl(var(--aqi-moderate))",
    bgColor: "bg-[hsl(var(--aqi-moderate)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-moderate)/0.3)]",
    description: "Air quality is acceptable for most people. Sensitive groups may experience minor issues." 
  };
  if (aqi <= 150) return { 
    level: "Unhealthy for Sensitive Groups", 
    color: "hsl(var(--aqi-sensitive))",
    bgColor: "bg-[hsl(var(--aqi-sensitive)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-sensitive)/0.3)]",
    description: "Members of sensitive groups may experience health effects." 
  };
  if (aqi <= 200) return { 
    level: "Unhealthy", 
    color: "hsl(var(--aqi-unhealthy))",
    bgColor: "bg-[hsl(var(--aqi-unhealthy)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-unhealthy)/0.3)]",
    description: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects." 
  };
  if (aqi <= 300) return { 
    level: "Very Unhealthy", 
    color: "hsl(var(--aqi-very-unhealthy))",
    bgColor: "bg-[hsl(var(--aqi-very-unhealthy)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-very-unhealthy)/0.3)]",
    description: "Health alert: The risk of health effects is increased for everyone." 
  };
  return { 
    level: "Hazardous", 
    color: "hsl(var(--aqi-hazardous))",
    bgColor: "bg-[hsl(var(--aqi-hazardous)/0.1)]",
    borderColor: "border-[hsl(var(--aqi-hazardous)/0.3)]",
    description: "Health warning of emergency conditions: everyone is more likely to be affected." 
  };
};

const AQIIndicator = ({ value, location, pollutant }: AQIIndicatorProps) => {
  const details = getAQIDetails(value);
  const percentage = Math.min((value / 300) * 100, 100);

  return (
    <Card className={cn(
      "p-6 transition-all hover:scale-105 border-2",
      details.bgColor,
      details.borderColor
    )}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{location}</h3>
            <p className="text-sm text-muted-foreground">{pollutant}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: details.color }}>
              {value}
            </div>
            <div className="text-xs text-muted-foreground">AQI</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: details.color }}>
              {details.level}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: details.color 
              }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {details.description}
        </p>
      </div>
    </Card>
  );
};

export default AQIIndicator;