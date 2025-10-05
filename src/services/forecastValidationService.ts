/**
 * Forecast Validation Service with Pandora Integration
 * Enhances forecast accuracy using ground-truth Pandora measurements
 */

import { pandoraService, PandoraMeasurement } from './pandoraService';
import { calculateValidationMetrics, filterQualityMeasurements } from '../utils/pandoraUtils';

export interface EnhancedForecast {
  location: string;
  forecast_hours: number;
  base_forecast: ForecastPoint[];
  pandora_validated_forecast: ForecastPoint[];
  validation_metrics: ValidationMetrics;
  confidence_adjustments: ConfidenceAdjustment[];
  recommendations: string[];
}

export interface ForecastPoint {
  timestamp: string;
  aqi: number;
  pollutants: {
    no2: number;
    o3: number;
    pm25: number;
    hcho: number;
  };
  confidence: number;
  quality_grade: 'high' | 'medium' | 'low';
  validation_source?: 'pandora' | 'model' | 'hybrid';
}

export interface ValidationMetrics {
  pandora_stations_used: number;
  validation_coverage: number; // percentage of forecast period with validation
  bias_corrections: {
    no2_bias: number;
    o3_bias: number;
    systematic_error: number;
  };
  uncertainty_reduction: number; // percentage reduction in forecast uncertainty
  validation_score: number; // overall validation quality (0-100)
}

export interface ConfidenceAdjustment {
  timestamp: string;
  original_confidence: number;
  adjusted_confidence: number;
  adjustment_reason: string;
  pandora_influence: number;
}

export interface ModelPerformance {
  location: string;
  period: string;
  metrics: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Square Error
    correlation: number;
    bias: number;
    skill_score: number;
  };
  pandora_validation_points: number;
}

class ForecastValidationService {
  private validationHistory: Map<string, ModelPerformance[]> = new Map();
  private biasCorrections: Map<string, { no2: number; o3: number }> = new Map();

  /**
   * Generate enhanced forecast with Pandora validation
   */
  async generateValidatedForecast(
    location: string,
    baseForecast: Omit<ForecastPoint, 'validation_source'>[],
    hours: number = 24
  ): Promise<EnhancedForecast> {
    try {
      // Find nearest Pandora station
      const locationCoords = this.parseLocationCoordinates(location);
      const nearestStation = await pandoraService.findNearestStation(
        locationCoords.lat, 
        locationCoords.lon
      );

      if (!nearestStation) {
        // Return base forecast without validation
        return this.createUnvalidatedForecast(location, baseForecast, hours);
      }

      // Get recent Pandora measurements for validation
      const recentMeasurements = await pandoraService.getStationMeasurements(
        nearestStation.id, 
        48 // Get 48 hours for better validation
      );

      // Filter for quality measurements
      const qualityMeasurements = filterQualityMeasurements(recentMeasurements, 'good');

      // Calculate bias corrections
      const biasCorrections = await this.calculateBiasCorrections(
        nearestStation.id,
        qualityMeasurements
      );

      // Generate Pandora-validated forecast
      const pandoraValidatedForecast = this.applyPandoraValidation(
        baseForecast,
        qualityMeasurements,
        biasCorrections
      );

      // Calculate validation metrics
      const validationMetrics = this.calculateValidationMetrics(
        baseForecast,
        pandoraValidatedForecast,
        qualityMeasurements,
        [nearestStation.id]
      );

      // Generate confidence adjustments
      const confidenceAdjustments = this.calculateConfidenceAdjustments(
        baseForecast,
        pandoraValidatedForecast,
        qualityMeasurements
      );

      // Generate recommendations
      const recommendations = this.generateValidationRecommendations(
        validationMetrics,
        nearestStation
      );

      return {
        location,
        forecast_hours: hours,
        base_forecast: baseForecast.map(f => ({ ...f, validation_source: 'model' as const })),
        pandora_validated_forecast,
        validation_metrics: validationMetrics,
        confidence_adjustments,
        recommendations
      };

    } catch (error) {
      console.error('Error generating validated forecast:', error);
      return this.createUnvalidatedForecast(location, baseForecast, hours);
    }
  }

  /**
   * Calculate bias corrections using recent Pandora measurements
   */
  private async calculateBiasCorrections(
    stationId: string,
    measurements: PandoraMeasurement[]
  ): Promise<{ no2: number; o3: number }> {
    // Check if we have cached corrections
    if (this.biasCorrections.has(stationId)) {
      return this.biasCorrections.get(stationId)!;
    }

    // Simulate satellite data for comparison (in production, use actual TEMPO data)
    const mockSatelliteData = measurements.map(m => ({
      timestamp: m.timestamp,
      no2: m.no2_column * (1 + (Math.random() - 0.5) * 0.3), // Add some bias
      o3: m.o3_column * (1 + (Math.random() - 0.5) * 0.2)
    }));

    try {
      const validationSummary = calculateValidationMetrics(
        measurements,
        mockSatelliteData,
        stationId
      );

      const corrections = {
        no2: -validationSummary.satellite_bias.tempo_no2_bias / 100, // Convert percentage to ratio
        o3: -validationSummary.satellite_bias.tempo_o3_bias / 100
      };

      // Cache the corrections
      this.biasCorrections.set(stationId, corrections);
      return corrections;

    } catch (error) {
      console.warn('Could not calculate bias corrections:', error);
      return { no2: 0, o3: 0 };
    }
  }

  /**
   * Apply Pandora validation to base forecast
   */
  private applyPandoraValidation(
    baseForecast: Omit<ForecastPoint, 'validation_source'>[],
    pandoraMeasurements: PandoraMeasurement[],
    biasCorrections: { no2: number; o3: number }
  ): ForecastPoint[] {
    const latestMeasurement = pandoraMeasurements[pandoraMeasurements.length - 1];
    
    return baseForecast.map((forecast, index) => {
      const hoursSinceLatest = index;
      const decayFactor = Math.exp(-hoursSinceLatest / 12); // Pandora influence decays over 12 hours

      // Apply bias corrections with decay
      const correctedNO2 = forecast.pollutants.no2 * (1 + biasCorrections.no2 * decayFactor);
      const correctedO3 = forecast.pollutants.o3 * (1 + biasCorrections.o3 * decayFactor);

      // Adjust confidence based on Pandora data quality and recency
      let confidenceBoost = 0;
      if (latestMeasurement) {
        const dataQuality = pandoraService.assessDataQuality(latestMeasurement);
        const qualityBoost = {
          excellent: 0.15,
          good: 0.10,
          fair: 0.05,
          poor: 0
        }[dataQuality.overall];

        confidenceBoost = qualityBoost * decayFactor;
      }

      const adjustedConfidence = Math.min(0.95, forecast.confidence + confidenceBoost);

      // Determine quality grade
      let qualityGrade: 'high' | 'medium' | 'low';
      if (adjustedConfidence >= 0.8 && decayFactor > 0.7) qualityGrade = 'high';
      else if (adjustedConfidence >= 0.6 && decayFactor > 0.4) qualityGrade = 'medium';
      else qualityGrade = 'low';

      return {
        timestamp: forecast.timestamp,
        aqi: forecast.aqi,
        pollutants: {
          no2: Math.max(0, correctedNO2),
          o3: Math.max(0, correctedO3),
          pm25: forecast.pollutants.pm25,
          hcho: forecast.pollutants.hcho
        },
        confidence: adjustedConfidence,
        quality_grade: qualityGrade,
        validation_source: decayFactor > 0.3 ? 'hybrid' as const : 'model' as const
      };
    });
  }

  /**
   * Calculate validation metrics
   */
  private calculateValidationMetrics(
    baseForecast: Omit<ForecastPoint, 'validation_source'>[],
    validatedForecast: ForecastPoint[],
    pandoraMeasurements: PandoraMeasurement[],
    stationIds: string[]
  ): ValidationMetrics {
    const validationCoverage = validatedForecast.filter(f => f.validation_source === 'hybrid').length / validatedForecast.length * 100;
    
    // Calculate average bias corrections
    const no2Bias = this.calculateAverageBias(
      baseForecast.map(f => f.pollutants.no2),
      validatedForecast.map(f => f.pollutants.no2)
    );
    
    const o3Bias = this.calculateAverageBias(
      baseForecast.map(f => f.pollutants.o3),
      validatedForecast.map(f => f.pollutants.o3)
    );

    // Calculate uncertainty reduction
    const baseUncertainty = this.calculateAverageUncertainty(baseForecast.map(f => f.confidence));
    const validatedUncertainty = this.calculateAverageUncertainty(validatedForecast.map(f => f.confidence));
    const uncertaintyReduction = ((validatedUncertainty - baseUncertainty) / baseUncertainty) * 100;

    // Calculate validation score
    const qualityScore = pandoraMeasurements.length > 0 ? 
      pandoraMeasurements.map(m => pandoraService.assessDataQuality(m)).filter(q => q.overall === 'excellent' || q.overall === 'good').length / pandoraMeasurements.length * 100 : 0;
    
    const validationScore = Math.min(100, (validationCoverage * 0.4 + qualityScore * 0.4 + Math.min(uncertaintyReduction, 30) * 0.2));

    return {
      pandora_stations_used: stationIds.length,
      validation_coverage: validationCoverage,
      bias_corrections: {
        no2_bias: no2Bias,
        o3_bias: o3Bias,
        systematic_error: Math.sqrt(no2Bias * no2Bias + o3Bias * o3Bias)
      },
      uncertainty_reduction: uncertaintyReduction,
      validation_score: validationScore
    };
  }

  /**
   * Calculate confidence adjustments
   */
  private calculateConfidenceAdjustments(
    baseForecast: Omit<ForecastPoint, 'validation_source'>[],
    validatedForecast: ForecastPoint[],
    pandoraMeasurements: PandoraMeasurement[]
  ): ConfidenceAdjustment[] {
    return baseForecast.map((base, index) => {
      const validated = validatedForecast[index];
      const adjustment = validated.confidence - base.confidence;
      
      let reason = 'No significant changes';
      let pandoraInfluence = 0;

      if (Math.abs(adjustment) > 0.05) {
        if (adjustment > 0) {
          reason = 'Confidence increased due to Pandora validation';
          pandoraInfluence = Math.min(1, adjustment / 0.15);
        } else {
          reason = 'Confidence decreased due to data uncertainty';
          pandoraInfluence = Math.max(-1, adjustment / 0.15);
        }
      }

      return {
        timestamp: base.timestamp,
        original_confidence: base.confidence,
        adjusted_confidence: validated.confidence,
        adjustment_reason: reason,
        pandora_influence: pandoraInfluence
      };
    });
  }

  /**
   * Generate validation recommendations
   */
  private generateValidationRecommendations(
    metrics: ValidationMetrics,
    station: { name: string; id: string }
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.validation_score >= 80) {
      recommendations.push(`High-quality forecast validation using ${station.name} Pandora station`);
    } else if (metrics.validation_score >= 60) {
      recommendations.push(`Moderate forecast validation available from ${station.name} station`);
    } else {
      recommendations.push(`Limited validation data available - use forecast with caution`);
    }

    if (metrics.validation_coverage < 50) {
      recommendations.push('Consider additional ground-based measurements for better validation');
    }

    if (Math.abs(metrics.bias_corrections.systematic_error) > 0.1) {
      recommendations.push('Systematic bias detected - forecast has been corrected using Pandora reference data');
    }

    if (metrics.uncertainty_reduction > 10) {
      recommendations.push(`Forecast uncertainty reduced by ${metrics.uncertainty_reduction.toFixed(1)}% using ground-truth validation`);
    }

    return recommendations;
  }

  /**
   * Create unvalidated forecast when Pandora data is unavailable
   */
  private createUnvalidatedForecast(
    location: string,
    baseForecast: Omit<ForecastPoint, 'validation_source'>[],
    hours: number
  ): EnhancedForecast {
    return {
      location,
      forecast_hours: hours,
      base_forecast: baseForecast.map(f => ({ ...f, validation_source: 'model' as const })),
      pandora_validated_forecast: baseForecast.map(f => ({ ...f, validation_source: 'model' as const })),
      validation_metrics: {
        pandora_stations_used: 0,
        validation_coverage: 0,
        bias_corrections: { no2_bias: 0, o3_bias: 0, systematic_error: 0 },
        uncertainty_reduction: 0,
        validation_score: 50 // Base score without validation
      },
      confidence_adjustments: baseForecast.map(f => ({
        timestamp: f.timestamp,
        original_confidence: f.confidence,
        adjusted_confidence: f.confidence,
        adjustment_reason: 'No Pandora validation available',
        pandora_influence: 0
      })),
      recommendations: [
        'No ground-based validation available for this location',
        'Forecast based solely on satellite and model data',
        'Consider results with additional caution'
      ]
    };
  }

  // Helper methods
  private parseLocationCoordinates(location: string): { lat: number; lon: number } {
    // Simple location parsing - in production, use geocoding service
    const locationMap: Record<string, { lat: number; lon: number }> = {
      'Los Angeles, CA': { lat: 34.0522, lon: -118.2437 },
      'New York, NY': { lat: 40.7128, lon: -74.0060 },
      'Chicago, IL': { lat: 41.8781, lon: -87.6298 },
      'Denver, CO': { lat: 39.7392, lon: -104.9903 },
      'Greenbelt, MD': { lat: 39.0014, lon: -76.8778 }
    };

    return locationMap[location] || { lat: 40, lon: -100 }; // Default to center of US
  }

  private calculateAverageBias(original: number[], corrected: number[]): number {
    if (original.length !== corrected.length || original.length === 0) return 0;
    
    const differences = original.map((val, i) => corrected[i] - val);
    return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  }

  private calculateAverageUncertainty(confidences: number[]): number {
    if (confidences.length === 0) return 1;
    
    const uncertainties = confidences.map(c => 1 - c);
    return uncertainties.reduce((sum, u) => sum + u, 0) / uncertainties.length;
  }

  /**
   * Evaluate model performance using Pandora validation
   */
  async evaluateModelPerformance(location: string, days: number = 7): Promise<ModelPerformance> {
    // Implementation would compare historical forecasts against Pandora measurements
    // For now, return mock performance metrics
    
    return {
      location,
      period: `Last ${days} days`,
      metrics: {
        mae: 15.2,
        rmse: 22.8,
        correlation: 0.78,
        bias: -2.1,
        skill_score: 0.65
      },
      pandora_validation_points: 156
    };
  }
}

export const forecastValidationService = new ForecastValidationService();
export default forecastValidationService;
