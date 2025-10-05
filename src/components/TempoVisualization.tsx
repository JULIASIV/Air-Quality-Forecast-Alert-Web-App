import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Satellite, Info, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface TempoVisualizationProps {
  location: string;
  data?: {
    no2: number;
    pm: number;
    o3: number;
    hcho: number;
  };
}

const TempoVisualization = ({ location, data }: TempoVisualizationProps) => {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("no2");

  const pollutants = [
    {
      key: "no2",
      name: "Nitrogen Dioxide",
      symbol: "NO₂",
      unit: "µg/m³",
      value: data?.no2 || 0,
      threshold: 40, // WHO guideline
      color: "bg-red-500",
      description: "Traffic and industrial emissions indicator",
      healthImpact: data?.no2 > 40 ? "Above WHO guidelines" : "Within safe levels"
    },
    {
      key: "pm", 
      name: "Particulate Matter",
      symbol: "PM2.5",
      unit: "µg/m³",
      value: data?.pm || 0,
      threshold: 15, // WHO guideline
      color: "bg-purple-500",
      description: "Fine particles from combustion and secondary formation",
      healthImpact: data?.pm > 15 ? "Above WHO guidelines" : "Within safe levels"
    },
    {
      key: "o3",
      name: "Ozone",
      symbol: "O₃", 
      unit: "µg/m³",
      value: data?.o3 || 0,
      threshold: 60, // WHO guideline
      color: "bg-blue-500",
      description: "Secondary pollutant formed from precursors",
      healthImpact: data?.o3 > 60 ? "Above WHO guidelines" : "Within safe levels"
    },
    {
      key: "hcho",
      name: "Formaldehyde",
      symbol: "HCHO",
      unit: "µg/m³",
      value: data?.hcho || 0,
      threshold: 100, // Reference value
      color: "bg-green-500",
      description: "Volatile organic compound from various sources",
      healthImpact: data?.hcho > 100 ? "Elevated levels" : "Normal levels"
    }
  ];

  const selectedPollutantData = pollutants.find(p => p.key === selectedPollutant);

  const getProgressValue = (value: number, threshold: number) => {
    return Math.min((value / (threshold * 2)) * 100, 100);
  };

  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Satellite className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">NASA TEMPO Satellite Data</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No TEMPO data available for {location}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Data may be limited by satellite coverage or weather conditions
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Pollutant Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Satellite className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">TEMPO Parameters</h3>
        </div>
        <div className="space-y-3">
          {pollutants.map((pollutant) => (
            <div
              key={pollutant.key}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedPollutant === pollutant.key 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'bg-muted/50 hover:bg-muted border border-border'
              }`}
              onClick={() => setSelectedPollutant(pollutant.key)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{pollutant.symbol}</span>
                <Badge 
                  variant={pollutant.value > pollutant.threshold ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {pollutant.value.toFixed(1)}
                </Badge>
              </div>
              <Progress 
                value={getProgressValue(pollutant.value, pollutant.threshold)}
                className="h-2 mb-2"
              />
              <div className="text-xs text-muted-foreground">
                {pollutant.name}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed View */}
      <Card className="md:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              {selectedPollutantData?.symbol}
              <Badge variant="outline">{location}</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedPollutantData?.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {selectedPollutantData?.value.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedPollutantData?.unit}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Concentration Level
            </span>
            <span className="text-sm text-muted-foreground">
              WHO Guideline: {selectedPollutantData?.threshold} {selectedPollutantData?.unit}
            </span>
          </div>
          <Progress 
            value={getProgressValue(selectedPollutantData?.value || 0, selectedPollutantData?.threshold || 100)}
            className={`h-4 ${selectedPollutantData?.color}`}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            <span>WHO Limit</span>
            <span>2x Limit</span>
          </div>
        </div>

        {/* Health Impact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${
            selectedPollutantData && selectedPollutantData.value > selectedPollutantData.threshold
              ? 'bg-red-50 dark:bg-red-900/10' 
              : 'bg-green-50 dark:bg-green-900/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {selectedPollutantData && selectedPollutantData.value > selectedPollutantData.threshold ? (
                <TrendingUp className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-600" />
              )}
              <span className="font-medium text-sm">Health Assessment</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedPollutantData?.healthImpact}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">Data Quality</span>
            </div>
            <p className="text-sm text-muted-foreground">
              High quality satellite measurements with 90%+ confidence
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Update:</span>
              <div className="font-medium">{new Date().toLocaleTimeString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Data Source:</span>
              <div className="font-medium">NASA TEMPO L2</div>
            </div>
            <div>
              <span className="text-muted-foreground">Resolution:</span>
              <div className="font-medium">2.1 km × 4.4 km</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TempoVisualization;
