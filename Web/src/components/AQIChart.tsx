import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface AQIChartProps {
  location: string;
}

interface ChartData {
  time: string;
  aqi: number;
  hour: number;
}

const AQIChart: React.FC<AQIChartProps> = ({ location }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateMockData();
  }, [location]);

  const generateMockData = () => {
    setLoading(true);
    const data: ChartData[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseAQI = 50 + Math.sin(i / 4) * 30 + Math.random() * 40;
      
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: Math.max(1, Math.round(baseAQI)),
        hour: i
      });
    }
    
    setChartData(data);
    setLoading(false);
  };

  const getLineColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981'; // green
    if (aqi <= 100) return '#F59E0B'; // yellow
    if (aqi <= 150) return '#F97316'; // orange
    if (aqi <= 200) return '#EF4444'; // red
    if (aqi <= 300) return '#8B5CF6'; // purple
    return '#7F1D1D'; // dark red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const aqi = payload[0].value;
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-800">{`Time: ${label}`}</p>
          <p className="text-sm text-blue-600">{`AQI: ${aqi}`}</p>
          <p className="text-xs text-gray-600">
            {aqi <= 50 ? 'Good' : 
             aqi <= 100 ? 'Moderate' : 
             aqi <= 150 ? 'Unhealthy for Sensitive' : 
             aqi <= 200 ? 'Unhealthy' : 
             aqi <= 300 ? 'Very Unhealthy' : 'Hazardous'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 'dataMax + 20']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* AQI Category Reference Lines */}
          <ReferenceLine y={50} stroke="#10B981" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={150} stroke="#F97316" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="2 2" opacity={0.5} />
          
          <Line 
            type="monotone" 
            dataKey="aqi" 
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-gray-600">Good (0-50)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span className="text-gray-600">Moderate (51-100)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500"></div>
          <span className="text-gray-600">Unhealthy (101-150)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-gray-600">Very Unhealthy (151+)</span>
        </div>
      </div>
    </div>
  );
};

export default AQIChart;
