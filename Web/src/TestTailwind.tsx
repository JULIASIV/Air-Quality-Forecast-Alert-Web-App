import React from 'react';

const TestTailwind: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🌍 Air Quality App</h1>
        <p className="text-gray-600 mb-6">
          TailwindCSS is working correctly! The NASA Space Apps Air Quality Forecast Alert Web App is ready.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Frontend ✅</h3>
            <p className="text-sm text-green-600">React + Vite + Tailwind</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Backend ✅</h3>
            <p className="text-sm text-blue-600">Node.js + Express</p>
          </div>
        </div>
        <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
          Start Monitoring Air Quality
        </button>
      </div>
    </div>
  );
};

export default TestTailwind;
