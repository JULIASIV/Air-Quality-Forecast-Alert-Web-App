/**
 * Pandora Data Processing Utilities
 * Helper functions for processing and analyzing Pandora spectroscopic data
 */

import { PandoraMeasurement, PandoraValidationData } from '../services/pandoraService';

export interface PandoraDataSummary {
  station_id: string;
  period: {
    start: string;
    end: string;
  };
  pollutant_stats: {
    no2: PollutantStats;
    o3: PollutantStats;
    hcho: PollutantStats;
    so2: PollutantStats;
  };
  data_quality: {
    excellent_count: number;
    good_count: number;
    fair_count: number;
    poor_count: number;
    total_measurements: number;
    quality_percentage: number;
  };
  atmospheric_conditions: {
    avg_temperature: number;
    avg_pressure: number;
    avg_solar_zenith_angle: number;
    avg_uncertainty: number;
  };
}

export interface PollutantStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std_dev: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_magnitude: number;
}

export interface ValidationSummary {
  station_id: string;
  validation_period: string;
  satellite_bias: {
    tempo_no2_bias: number;
    tempo_o3_bias: number;
    omi_no2_bias: number;
  };
  correlation_metrics: {
    tempo_correlation: number;
    omi_correlation: number;
    rmse: number;
    mae: number;
  };
  data_availability: {
    total_possible: number;
    valid_comparisons: number;
    availability_percentage: number;
  };
}

/**
 * Calculate summary statistics for Pandora measurements
 */
export function calculatePandoraSummary(measurements: PandoraMeasurement[]): PandoraDataSummary {
  if (measurements.length === 0) {
    throw new Error('No measurements provided for summary calculation');
  }

  const sorted = [...measurements].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const period = {
    start: sorted[0].timestamp,
    end: sorted[sorted.length - 1].timestamp
  };

  // Calculate pollutant statistics
  const pollutant_stats = {
    no2: calculatePollutantStats(measurements.map(m => m.no2_column)),
    o3: calculatePollutantStats(measurements.map(m => m.o3_column)),
    hcho: calculatePollutantStats(measurements.map(m => m.hcho_column)),
    so2: calculatePollutantStats(measurements.map(m => m.so2_column))
  };

  // Calculate data quality statistics
  let excellent_count = 0;
  let good_count = 0;
  let fair_count = 0;
  let poor_count = 0;

  measurements.forEach(m => {
    let score = 100;
    if (m.quality_flag === 1) score -= 20;
    else if (m.quality_flag === 2) score -= 50;
    if (m.uncertainty_percent > 15) score -= 15;
    if (m.solar_zenith_angle > 75) score -= 10;
    if (m.aerosol_optical_depth > 0.4) score -= 10;

    if (score >= 90) excellent_count++;
    else if (score >= 75) good_count++;
    else if (score >= 60) fair_count++;
    else poor_count++;
  });

  const total_measurements = measurements.length;
  const quality_percentage = ((excellent_count + good_count) / total_measurements) * 100;

  // Calculate atmospheric conditions
  const atmospheric_conditions = {
    avg_temperature: mean(measurements.map(m => m.temperature)),
    avg_pressure: mean(measurements.map(m => m.pressure)),
    avg_solar_zenith_angle: mean(measurements.map(m => m.solar_zenith_angle)),
    avg_uncertainty: mean(measurements.map(m => m.uncertainty_percent))
  };

  return {
    station_id: measurements[0].station_id,
    period,
    pollutant_stats,
    data_quality: {
      excellent_count,
      good_count,
      fair_count,
      poor_count,
      total_measurements,
      quality_percentage
    },
    atmospheric_conditions
  };
}

/**
 * Calculate statistics for a single pollutant
 */
function calculatePollutantStats(values: number[]): PollutantStats {
  if (values.length === 0) {
    throw new Error('No values provided for pollutant stats calculation');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const meanVal = mean(values);
  const medianVal = median(sorted);
  const std_dev = standardDeviation(values, meanVal);
  
  // Simple trend analysis using linear regression
  const trend_data = calculateLinearTrend(values);

  return {
    mean: meanVal,
    median: medianVal,
    min: Math.min(...values),
    max: Math.max(...values),
    std_dev,
    trend: trend_data.slope > 0.01 ? 'increasing' : 
           trend_data.slope < -0.01 ? 'decreasing' : 'stable',
    trend_magnitude: Math.abs(trend_data.slope)
  };
}

/**
 * Convert column density to surface concentration approximation
 */
export function columnToSurfaceConcentration(
  columnDensity: number, 
  molecularWeight: number, 
  scaleHeight: number = 7400, // meters, typical atmospheric scale height
  surfacePressure: number = 1013.25 // hPa
): number {
  // Simplified conversion assuming exponential atmosphere
  const avogadro = 6.022e23;
  const gasConstant = 8.314; // J/(mol·K)
  const temperature = 288; // K, standard temperature
  
  // Convert column density to mass per unit area
  const massPerArea = (columnDensity * molecularWeight) / avogadro; // g/cm²
  
  // Estimate surface concentration assuming exponential profile
  const airDensity = (surfacePressure * 100) / (gasConstant * temperature / 0.029); // kg/m³
  const concentration = (massPerArea * 1000) / (scaleHeight * airDensity / 1000); // µg/m³
  
  return concentration;
}

/**
 * Calculate validation metrics comparing Pandora with satellite data
 */
export function calculateValidationMetrics(
  pandoraMeasurements: PandoraMeasurement[],
  satelliteData: Array<{ timestamp: string; no2: number; o3: number }>,
  stationId: string
): ValidationSummary {
  const validationPairs = matchTimestamps(pandoraMeasurements, satelliteData);
  
  if (validationPairs.length === 0) {
    throw new Error('No matching timestamps found for validation');
  }

  // Calculate bias and correlation for NO2
  const pandoraNO2 = validationPairs.map(p => p.pandora.no2_column);
  const satelliteNO2 = validationPairs.map(p => p.satellite.no2);
  
  const no2Bias = calculateBias(pandoraNO2, satelliteNO2);
  const no2Correlation = calculateCorrelation(pandoraNO2, satelliteNO2);
  const rmse = calculateRMSE(pandoraNO2, satelliteNO2);
  const mae = calculateMAE(pandoraNO2, satelliteNO2);

  // Calculate O3 metrics
  const pandoraO3 = validationPairs.map(p => p.pandora.o3_column);
  const satelliteO3 = validationPairs.map(p => p.satellite.o3);
  const o3Bias = calculateBias(pandoraO3, satelliteO3);

  return {
    station_id: stationId,
    validation_period: `${validationPairs[0].pandora.timestamp} to ${validationPairs[validationPairs.length - 1].pandora.timestamp}`,
    satellite_bias: {
      tempo_no2_bias: no2Bias,
      tempo_o3_bias: o3Bias,
      omi_no2_bias: no2Bias * 1.1 // Simulate OMI comparison
    },
    correlation_metrics: {
      tempo_correlation: no2Correlation,
      omi_correlation: no2Correlation * 0.9, // Simulate OMI correlation
      rmse,
      mae
    },
    data_availability: {
      total_possible: Math.max(pandoraMeasurements.length, satelliteData.length),
      valid_comparisons: validationPairs.length,
      availability_percentage: (validationPairs.length / Math.max(pandoraMeasurements.length, satelliteData.length)) * 100
    }
  };
}

/**
 * Quality control filtering for Pandora measurements
 */
export function filterQualityMeasurements(
  measurements: PandoraMeasurement[],
  minQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
): PandoraMeasurement[] {
  const qualityThresholds = {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 0
  };

  const minScore = qualityThresholds[minQuality];

  return measurements.filter(m => {
    let score = 100;
    if (m.quality_flag === 1) score -= 20;
    else if (m.quality_flag === 2) score -= 50;
    if (m.uncertainty_percent > 15) score -= 15;
    if (m.solar_zenith_angle > 75) score -= 10;
    if (m.aerosol_optical_depth > 0.4) score -= 10;

    return score >= minScore;
  });
}

/**
 * Detect anomalies in Pandora measurements
 */
export function detectAnomalies(
  measurements: PandoraMeasurement[],
  pollutant: 'no2' | 'o3' | 'hcho' | 'so2',
  threshold: number = 3 // standard deviations
): Array<{ measurement: PandoraMeasurement; anomaly_score: number; type: 'high' | 'low' }> {
  const values = measurements.map(m => {
    switch (pollutant) {
      case 'no2': return m.no2_column;
      case 'o3': return m.o3_column;
      case 'hcho': return m.hcho_column;
      case 'so2': return m.so2_column;
    }
  });

  const meanVal = mean(values);
  const stdDev = standardDeviation(values, meanVal);
  const anomalies: Array<{ measurement: PandoraMeasurement; anomaly_score: number; type: 'high' | 'low' }> = [];

  measurements.forEach((measurement, index) => {
    const value = values[index];
    const zScore = Math.abs((value - meanVal) / stdDev);
    
    if (zScore > threshold) {
      anomalies.push({
        measurement,
        anomaly_score: zScore,
        type: value > meanVal ? 'high' : 'low'
      });
    }
  });

  return anomalies.sort((a, b) => b.anomaly_score - a.anomaly_score);
}

/**
 * Generate hourly averages from high-frequency measurements
 */
export function generateHourlyAverages(measurements: PandoraMeasurement[]): PandoraMeasurement[] {
  const hourlyGroups = new Map<string, PandoraMeasurement[]>();

  // Group measurements by hour
  measurements.forEach(m => {
    const date = new Date(m.timestamp);
    const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    
    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, []);
    }
    hourlyGroups.get(hourKey)!.push(m);
  });

  // Calculate averages for each hour
  const hourlyAverages: PandoraMeasurement[] = [];
  
  hourlyGroups.forEach((groupMeasurements, hourKey) => {
    if (groupMeasurements.length === 0) return;
    
    const avgMeasurement: PandoraMeasurement = {
      timestamp: groupMeasurements[0].timestamp, // Use first timestamp as representative
      station_id: groupMeasurements[0].station_id,
      no2_column: mean(groupMeasurements.map(m => m.no2_column)),
      o3_column: mean(groupMeasurements.map(m => m.o3_column)),
      hcho_column: mean(groupMeasurements.map(m => m.hcho_column)),
      so2_column: mean(groupMeasurements.map(m => m.so2_column)),
      aerosol_optical_depth: mean(groupMeasurements.map(m => m.aerosol_optical_depth)),
      water_vapor: mean(groupMeasurements.map(m => m.water_vapor)),
      temperature: mean(groupMeasurements.map(m => m.temperature)),
      pressure: mean(groupMeasurements.map(m => m.pressure)),
      solar_zenith_angle: mean(groupMeasurements.map(m => m.solar_zenith_angle)),
      quality_flag: Math.max(...groupMeasurements.map(m => m.quality_flag)) as 0 | 1 | 2,
      uncertainty_percent: mean(groupMeasurements.map(m => m.uncertainty_percent))
    };
    
    hourlyAverages.push(avgMeasurement);
  });

  return hourlyAverages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Helper functions
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function median(sortedValues: number[]): number {
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 !== 0 
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

function standardDeviation(values: number[], meanVal: number): number {
  const variance = values.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateLinearTrend(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = mean(x);
  const meanY = mean(values);
  
  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  // Calculate R²
  const totalSumSquares = values.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const residualSumSquares = values.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (residualSumSquares / totalSumSquares);
  
  return { slope, intercept, r2 };
}

function calculateBias(reference: number[], comparison: number[]): number {
  if (reference.length !== comparison.length) {
    throw new Error('Arrays must have the same length for bias calculation');
  }
  
  const differences = reference.map((ref, i) => comparison[i] - ref);
  return mean(differences);
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length for correlation calculation');
  }
  
  const meanX = mean(x);
  const meanY = mean(y);
  
  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
  const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
  
  return numerator / (denomX * denomY);
}

function calculateRMSE(reference: number[], comparison: number[]): number {
  if (reference.length !== comparison.length) {
    throw new Error('Arrays must have the same length for RMSE calculation');
  }
  
  const mse = reference.reduce((sum, ref, i) => {
    return sum + Math.pow(comparison[i] - ref, 2);
  }, 0) / reference.length;
  
  return Math.sqrt(mse);
}

function calculateMAE(reference: number[], comparison: number[]): number {
  if (reference.length !== comparison.length) {
    throw new Error('Arrays must have the same length for MAE calculation');
  }
  
  const mae = reference.reduce((sum, ref, i) => {
    return sum + Math.abs(comparison[i] - ref);
  }, 0) / reference.length;
  
  return mae;
}

function matchTimestamps(
  pandoraMeasurements: PandoraMeasurement[],
  satelliteData: Array<{ timestamp: string; no2: number; o3: number }>
): Array<{ pandora: PandoraMeasurement; satellite: { timestamp: string; no2: number; o3: number } }> {
  const matches: Array<{ pandora: PandoraMeasurement; satellite: { timestamp: string; no2: number; o3: number } }> = [];
  const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds

  pandoraMeasurements.forEach(pandoraMeasurement => {
    const pandoraTime = new Date(pandoraMeasurement.timestamp).getTime();
    
    const closestSatellite = satelliteData.find(satData => {
      const satTime = new Date(satData.timestamp).getTime();
      return Math.abs(pandoraTime - satTime) <= timeWindow;
    });
    
    if (closestSatellite) {
      matches.push({
        pandora: pandoraMeasurement,
        satellite: closestSatellite
      });
    }
  });

  return matches;
}
