/**
 * NASA Pandora Project API Service
 * Integrates with NASA Pandora Global Network for ground-based spectroscopic measurements
 * https://pandora.gsfc.nasa.gov/
 */

export interface PandoraStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  status: 'active' | 'inactive' | 'maintenance';
  instruments: string[];
  country: string;
  region: string;
}

export interface PandoraMeasurement {
  timestamp: string;
  station_id: string;
  no2_column: number; // molecules/cm²
  o3_column: number; // molecules/cm²
  hcho_column: number; // molecules/cm²
  so2_column: number; // molecules/cm²
  aerosol_optical_depth: number;
  water_vapor: number; // molecules/cm²
  temperature: number;
  pressure: number;
  solar_zenith_angle: number;
  quality_flag: 0 | 1 | 2; // 0: good, 1: questionable, 2: bad
  uncertainty_percent: number;
}

export interface PandoraValidationData {
  station_id: string;
  timestamp: string;
  satellite_comparison: {
    tempo_no2_diff: number; // percentage difference
    tempo_o3_diff: number;
    omi_no2_diff: number;
    correlation_coefficient: number;
  };
  trend_analysis: {
    daily_average: number;
    weekly_trend: 'increasing' | 'decreasing' | 'stable';
    seasonal_adjustment: number;
  };
}

class PandoraService {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    // In production, use environment variables
    this.baseUrl = 'https://pandora.gsfc.nasa.gov/api/v1';
    this.apiKey = null; // Set via environment or config
  }

  /**
   * Get all active Pandora stations
   */
  async getStations(): Promise<PandoraStation[]> {
    try {
      // Mock data for demonstration - replace with actual API call
      const mockStations: PandoraStation[] = [
        {
          id: 'pandora_001',
          name: 'Greenbelt, MD',
          latitude: 39.0014,
          longitude: -76.8778,
          elevation: 87,
          status: 'active',
          instruments: ['Pandora 2S', 'MAX-DOAS'],
          country: 'USA',
          region: 'North America'
        },
        {
          id: 'pandora_002',
          name: 'Los Angeles, CA',
          latitude: 34.0522,
          longitude: -118.2437,
          elevation: 71,
          status: 'active',
          instruments: ['Pandora 2S'],
          country: 'USA',
          region: 'North America'
        },
        {
          id: 'pandora_003',
          name: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          elevation: 10,
          status: 'active',
          instruments: ['Pandora 2S', 'Brewer'],
          country: 'USA',
          region: 'North America'
        },
        {
          id: 'pandora_004',
          name: 'Chicago, IL',
          latitude: 41.8781,
          longitude: -87.6298,
          elevation: 181,
          status: 'active',
          instruments: ['Pandora 2S'],
          country: 'USA',
          region: 'North America'
        },
        {
          id: 'pandora_005',
          name: 'Denver, CO',
          latitude: 39.7392,
          longitude: -104.9903,
          elevation: 1609,
          status: 'active',
          instruments: ['Pandora 2S'],
          country: 'USA',
          region: 'North America'
        }
      ];

      return mockStations;
    } catch (error) {
      console.error('Error fetching Pandora stations:', error);
      throw new Error('Failed to fetch Pandora station data');
    }
  }

  /**
   * Get recent measurements from a specific station
   */
  async getStationMeasurements(stationId: string, hours: number = 24): Promise<PandoraMeasurement[]> {
    try {
      // Mock data for demonstration - replace with actual API call
      const now = new Date();
      const measurements: PandoraMeasurement[] = [];

      for (let i = 0; i < hours; i++) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        
        measurements.push({
          timestamp: timestamp.toISOString(),
          station_id: stationId,
          no2_column: (2.5e15 + Math.random() * 1e15), // Typical NO2 column values
          o3_column: (3.2e18 + Math.random() * 5e17), // Typical O3 column values
          hcho_column: (8.5e14 + Math.random() * 3e14), // Typical HCHO column values
          so2_column: (1.2e15 + Math.random() * 5e14), // Typical SO2 column values
          aerosol_optical_depth: 0.1 + Math.random() * 0.3,
          water_vapor: (1.5e22 + Math.random() * 8e21),
          temperature: 20 + Math.random() * 15,
          pressure: 1013 + Math.random() * 20,
          solar_zenith_angle: Math.abs(Math.sin(i * Math.PI / 12)) * 90,
          quality_flag: Math.random() > 0.1 ? 0 : (Math.random() > 0.5 ? 1 : 2),
          uncertainty_percent: 5 + Math.random() * 10
        });
      }

      return measurements.reverse(); // Oldest first
    } catch (error) {
      console.error('Error fetching Pandora measurements:', error);
      throw new Error('Failed to fetch Pandora measurement data');
    }
  }

  /**
   * Get validation data comparing Pandora measurements with satellite data
   */
  async getValidationData(stationId: string): Promise<PandoraValidationData> {
    try {
      // Mock validation data - replace with actual API call
      const validationData: PandoraValidationData = {
        station_id: stationId,
        timestamp: new Date().toISOString(),
        satellite_comparison: {
          tempo_no2_diff: (Math.random() - 0.5) * 20, // ±10% difference
          tempo_o3_diff: (Math.random() - 0.5) * 15,
          omi_no2_diff: (Math.random() - 0.5) * 25,
          correlation_coefficient: 0.75 + Math.random() * 0.2
        },
        trend_analysis: {
          daily_average: 2.8e15 + Math.random() * 1e15,
          weekly_trend: Math.random() > 0.5 ? 'increasing' : (Math.random() > 0.5 ? 'decreasing' : 'stable'),
          seasonal_adjustment: (Math.random() - 0.5) * 0.3
        }
      };

      return validationData;
    } catch (error) {
      console.error('Error fetching Pandora validation data:', error);
      throw new Error('Failed to fetch Pandora validation data');
    }
  }

  /**
   * Find nearest Pandora station to given coordinates
   */
  async findNearestStation(lat: number, lon: number): Promise<PandoraStation | null> {
    try {
      const stations = await this.getStations();
      
      let nearest: PandoraStation | null = null;
      let minDistance = Infinity;

      stations.forEach(station => {
        const distance = this.calculateDistance(lat, lon, station.latitude, station.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = station;
        }
      });

      return nearest;
    } catch (error) {
      console.error('Error finding nearest Pandora station:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert column density to concentration approximation
   */
  static columnToConcentration(columnDensity: number, molecularWeight: number): number {
    // Simplified conversion - in practice, needs atmospheric profile data
    const avogadro = 6.022e23;
    const airDensity = 1.225; // kg/m³ at sea level
    return (columnDensity * molecularWeight) / (avogadro * airDensity * 1000); // µg/m³
  }

  /**
   * Get data quality assessment
   */
  static assessDataQuality(measurement: PandoraMeasurement): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 100;

    if (measurement.quality_flag === 1) {
      factors.push('Questionable quality flag');
      score -= 20;
    } else if (measurement.quality_flag === 2) {
      factors.push('Bad quality flag');
      score -= 50;
    }

    if (measurement.uncertainty_percent > 15) {
      factors.push('High measurement uncertainty');
      score -= 15;
    }

    if (measurement.solar_zenith_angle > 75) {
      factors.push('High solar zenith angle');
      score -= 10;
    }

    if (measurement.aerosol_optical_depth > 0.4) {
      factors.push('High aerosol loading');
      score -= 10;
    }

    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) overall = 'excellent';
    else if (score >= 75) overall = 'good';
    else if (score >= 60) overall = 'fair';
    else overall = 'poor';

    return { overall, factors };
  }
}

export const pandoraService = new PandoraService();
export default pandoraService;
