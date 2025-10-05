import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Clock, 
  User, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  Baby,
  Users,
  Zap,
  Calculator,
  Info
} from 'lucide-react';

interface HealthProfile {
  age: number;
  healthConditions: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  sensitiveGroup: boolean;
}

interface ExposureData {
  currentAQI: number;
  exposureTime: number; // in minutes
  activityType: 'indoor' | 'outdoor_light' | 'outdoor_moderate' | 'outdoor_vigorous';
  location: string;
}

interface HealthImpact {
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  shortTermEffects: string[];
  longTermRisks: string[];
  recommendations: string[];
  healthScore: number; // 0-100
  equivalentExposure: string;
}

const HealthImpactCalculator: React.FC = () => {
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    age: 30,
    healthConditions: [],
    activityLevel: 'moderate',
    sensitiveGroup: false
  });

  const [exposureData, setExposureData] = useState<ExposureData>({
    currentAQI: 85,
    exposureTime: 60,
    activityType: 'outdoor_light',
    location: 'New York'
  });

  const [healthImpact, setHealthImpact] = useState<HealthImpact | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const healthConditionOptions = [
    'Asthma',
    'Heart Disease',
    'Diabetes',
    'Lung Disease',
    'Allergies',
    'Pregnancy',
    'Elderly (65+)',
    'Children (under 12)'
  ];

  useEffect(() => {
    calculateHealthImpact();
  }, [healthProfile, exposureData]);

  const calculateHealthImpact = () => {
    const { currentAQI, exposureTime, activityType } = exposureData;
    const { age, healthConditions, activityLevel, sensitiveGroup } = healthProfile;

    // Base risk calculation
    let riskScore = 0;
    
    // AQI impact
    if (currentAQI <= 50) riskScore += 1;
    else if (currentAQI <= 100) riskScore += 2;
    else if (currentAQI <= 150) riskScore += 4;
    else if (currentAQI <= 200) riskScore += 6;
    else if (currentAQI <= 300) riskScore += 8;
    else riskScore += 10;

    // Exposure time factor
    const timeMultiplier = Math.min(exposureTime / 60, 3); // Cap at 3 hours effect
    riskScore *= timeMultiplier;

    // Activity type factor
    const activityMultipliers = {
      indoor: 0.3,
      outdoor_light: 1.0,
      outdoor_moderate: 1.5,
      outdoor_vigorous: 2.0
    };
    riskScore *= activityMultipliers[activityType];

    // Age factor
    if (age < 12 || age > 65) riskScore *= 1.3;
    else if (age < 18 || age > 55) riskScore *= 1.1;

    // Health conditions factor
    if (healthConditions.length > 0) riskScore *= (1 + healthConditions.length * 0.2);
    if (sensitiveGroup) riskScore *= 1.2;

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
    if (riskScore <= 2) riskLevel = 'low';
    else if (riskScore <= 5) riskLevel = 'moderate';
    else if (riskScore <= 8) riskLevel = 'high';
    else riskLevel = 'very_high';

    // Calculate health score (inverse of risk)
    const healthScore = Math.max(0, Math.min(100, 100 - (riskScore * 8)));

    // Generate effects and recommendations
    const shortTermEffects = getShortTermEffects(currentAQI, healthConditions);
    const longTermRisks = getLongTermRisks(currentAQI, exposureTime, healthConditions);
    const recommendations = getRecommendations(riskLevel, currentAQI, activityType, healthConditions);
    const equivalentExposure = getEquivalentExposure(currentAQI, exposureTime);

    setHealthImpact({
      riskLevel,
      shortTermEffects,
      longTermRisks,
      recommendations,
      healthScore,
      equivalentExposure
    });
  };

  const getShortTermEffects = (aqi: number, conditions: string[]) => {
    const effects: string[] = [];
    
    if (aqi > 100) {
      effects.push('Eye irritation and dryness');
      effects.push('Throat irritation');
      
      if (conditions.includes('Asthma')) {
        effects.push('Increased asthma symptoms');
        effects.push('Shortness of breath');
      }
      
      if (aqi > 150) {
        effects.push('Coughing and sneezing');
        effects.push('Reduced lung function');
        
        if (conditions.includes('Heart Disease')) {
          effects.push('Chest discomfort');
          effects.push('Irregular heartbeat');
        }
      }
    }

    if (effects.length === 0) {
      effects.push('Minimal short-term effects expected');
    }

    return effects;
  };

  const getLongTermRisks = (aqi: number, time: number, conditions: string[]) => {
    const risks: string[] = [];
    
    if (aqi > 100 && time > 120) {
      risks.push('Increased risk of respiratory infections');
      
      if (aqi > 150) {
        risks.push('Accelerated lung function decline');
        risks.push('Increased cardiovascular disease risk');
        
        if (conditions.length > 0) {
          risks.push('Worsening of existing health conditions');
        }
      }
    }

    if (risks.length === 0) {
      risks.push('Low long-term health risks at current exposure');
    }

    return risks;
  };

  const getRecommendations = (risk: string, aqi: number, activity: string, conditions: string[]) => {
    const recommendations: string[] = [];

    if (risk === 'low') {
      recommendations.push('Continue normal activities');
      recommendations.push('Stay hydrated');
    } else if (risk === 'moderate') {
      recommendations.push('Limit prolonged outdoor activities');
      recommendations.push('Consider wearing a mask outdoors');
      if (conditions.length > 0) {
        recommendations.push('Monitor symptoms closely');
      }
    } else if (risk === 'high') {
      recommendations.push('Avoid outdoor exercise');
      recommendations.push('Use air purifiers indoors');
      recommendations.push('Wear N95 masks when outdoors');
      recommendations.push('Close windows and use AC on recirculate');
    } else {
      recommendations.push('Stay indoors as much as possible');
      recommendations.push('Avoid all outdoor activities');
      recommendations.push('Seek medical advice if symptoms worsen');
      recommendations.push('Use HEPA air purifiers');
    }

    return recommendations;
  };

  const getEquivalentExposure = (aqi: number, time: number) => {
    const cigaretteEquivalent = Math.round((aqi * time) / 200);
    if (cigaretteEquivalent < 1) {
      return 'Less than smoking 1 cigarette';
    } else if (cigaretteEquivalent === 1) {
      return 'Equivalent to smoking 1 cigarette';
    } else {
      return `Equivalent to smoking ${cigaretteEquivalent} cigarettes`;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'very_high': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Health Impact Calculator
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
        >
          {showAdvanced ? 'Simple View' : 'Advanced'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Age
            </label>
            <input
              type="number"
              value={healthProfile.age}
              onChange={(e) => setHealthProfile({...healthProfile, age: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Exposure Time (minutes)
            </label>
            <input
              type="number"
              value={exposureData.exposureTime}
              onChange={(e) => setExposureData({...exposureData, exposureTime: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1440"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Activity className="w-4 h-4 inline mr-1" />
              Activity Type
            </label>
            <select
              value={exposureData.activityType}
              onChange={(e) => setExposureData({...exposureData, activityType: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="indoor">Indoor Activities</option>
              <option value="outdoor_light">Outdoor Light Activity</option>
              <option value="outdoor_moderate">Outdoor Moderate Activity</option>
              <option value="outdoor_vigorous">Outdoor Vigorous Exercise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 inline mr-1" />
              Current AQI
            </label>
            <input
              type="number"
              value={exposureData.currentAQI}
              onChange={(e) => setExposureData({...exposureData, currentAQI: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="500"
            />
          </div>

          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                Health Conditions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {healthConditionOptions.map(condition => (
                  <label key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={healthProfile.healthConditions.includes(condition)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHealthProfile({
                            ...healthProfile,
                            healthConditions: [...healthProfile.healthConditions, condition]
                          });
                        } else {
                          setHealthProfile({
                            ...healthProfile,
                            healthConditions: healthProfile.healthConditions.filter(c => c !== condition)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {healthImpact && (
            <>
              {/* Health Score */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-4xl font-bold ${getHealthScoreColor(healthImpact.healthScore)}`}>
                  {healthImpact.healthScore}
                </div>
                <div className="text-sm text-gray-600 mt-1">Health Score (0-100)</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${healthImpact.healthScore >= 80 ? 'bg-green-500' : 
                      healthImpact.healthScore >= 60 ? 'bg-yellow-500' : 
                      healthImpact.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${healthImpact.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Risk Level */}
              <div className={`p-4 rounded-lg border-2 ${getRiskColor(healthImpact.riskLevel)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Risk Level: {healthImpact.riskLevel.replace('_', ' ').toUpperCase()}</span>
                </div>
                <p className="text-sm">{healthImpact.equivalentExposure}</p>
              </div>

              {/* Short-term Effects */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Short-term Effects
                </h4>
                <ul className="space-y-1">
                  {healthImpact.shortTermEffects.map((effect, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                      <span className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></span>
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {healthImpact.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {showAdvanced && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Long-term Risks
                  </h4>
                  <ul className="space-y-1">
                    {healthImpact.longTermRisks.map((risk, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <button className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
          📧 Email Report
        </button>
        <button className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
          📱 Set Reminder
        </button>
        <button className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">
          📊 Track Progress
        </button>
        <button className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors">
          🏥 Find Doctor
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        This calculator provides estimates based on general health guidelines and should not replace professional medical advice.
      </div>
    </div>
  );
};

export default HealthImpactCalculator;
