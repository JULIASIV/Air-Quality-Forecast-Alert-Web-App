import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PollutantData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
}

interface PollutantChartProps {
  data: PollutantData;
}

const PollutantChart: React.FC<PollutantChartProps> = ({ data }) => {
  const barData = [
    { name: 'PM2.5', value: data.pm25, unit: 'µg/m³', color: '#EF4444' },
    { name: 'PM10', value: data.pm10, unit: 'µg/m³', color: '#F97316' },
    { name: 'NO₂', value: data.no2, unit: 'µg/m³', color: '#3B82F6' },
    { name: 'O₃', value: data.o3, unit: 'µg/m³', color: '#8B5CF6' },
    { name: 'CO', value: data.co, unit: 'mg/m³', color: '#6B7280' }
  ];

  const pieData = [
    { name: 'PM2.5', value: data.pm25, color: '#EF4444' },
    { name: 'PM10', value: data.pm10, color: '#F97316' },
    { name: 'NO₂', value: data.no2, color: '#3B82F6' },
    { name: 'O₃', value: data.o3, color: '#8B5CF6' },
    { name: 'CO', value: data.co * 10, color: '#6B7280' } // Scale CO for visibility
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-800">{`${data.name}: ${payload[0].value} ${data.unit}`}</p>
          <p className="text-xs text-gray-600">
            {data.name === 'PM2.5' && 'Fine particles that can penetrate deep into lungs'}
            {data.name === 'PM10' && 'Coarse particles from dust and pollen'}
            {data.name === 'NO₂' && 'Nitrogen dioxide from vehicle emissions'}
            {data.name === 'O₃' && 'Ground-level ozone, a key smog component'}
            {data.name === 'CO' && 'Carbon monoxide from incomplete combustion'}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-800">{`${data.name}: ${data.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-4">Pollutant Levels</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-4">Pollutant Distribution</h4>
        <div className="flex items-center">
          <div className="h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="ml-6 space-y-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-700">{entry.name}</span>
                <span className="text-xs text-gray-500">
                  {entry.name === 'CO' ? `${data.co} mg/m³` : `${entry.value} µg/m³`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Impact Guidelines */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Health Impact Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
          <div>
            <strong>PM2.5:</strong> WHO limit: 15 µg/m³ (24h avg)
          </div>
          <div>
            <strong>PM10:</strong> WHO limit: 45 µg/m³ (24h avg)
          </div>
          <div>
            <strong>NO₂:</strong> WHO limit: 25 µg/m³ (24h avg)
          </div>
          <div>
            <strong>O₃:</strong> WHO limit: 100 µg/m³ (8h avg)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollutantChart;
