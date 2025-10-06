import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Star, Clock } from 'lucide-react';

interface LocationSearchProps {
  onLocationChange: (location: string) => void;
  currentLocation: string;
}

interface LocationSuggestion {
  name: string;
  displayName: string;
  country: string;
  popular?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationChange, currentLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const popularLocations: LocationSuggestion[] = [
    { name: 'New-York', displayName: 'New York', country: 'USA', popular: true },
    { name: 'Los-Angeles', displayName: 'Los Angeles', country: 'USA', popular: true },
    { name: 'London', displayName: 'London', country: 'UK', popular: true },
    { name: 'Tokyo', displayName: 'Tokyo', country: 'Japan', popular: true },
    { name: 'Paris', displayName: 'Paris', country: 'France', popular: true },
    { name: 'Beijing', displayName: 'Beijing', country: 'China', popular: true },
    { name: 'Mumbai', displayName: 'Mumbai', country: 'India', popular: true },
    { name: 'Sydney', displayName: 'Sydney', country: 'Australia', popular: true },
  ];

  const allLocations: LocationSuggestion[] = [
    ...popularLocations,
    { name: 'Chicago', displayName: 'Chicago', country: 'USA' },
    { name: 'Houston', displayName: 'Houston', country: 'USA' },
    { name: 'Phoenix', displayName: 'Phoenix', country: 'USA' },
    { name: 'Philadelphia', displayName: 'Philadelphia', country: 'USA' },
    { name: 'San-Antonio', displayName: 'San Antonio', country: 'USA' },
    { name: 'San-Diego', displayName: 'San Diego', country: 'USA' },
    { name: 'Dallas', displayName: 'Dallas', country: 'USA' },
    { name: 'San-Jose', displayName: 'San Jose', country: 'USA' },
    { name: 'Austin', displayName: 'Austin', country: 'USA' },
    { name: 'Jacksonville', displayName: 'Jacksonville', country: 'USA' },
    { name: 'Berlin', displayName: 'Berlin', country: 'Germany' },
    { name: 'Madrid', displayName: 'Madrid', country: 'Spain' },
    { name: 'Rome', displayName: 'Rome', country: 'Italy' },
    { name: 'Amsterdam', displayName: 'Amsterdam', country: 'Netherlands' },
    { name: 'Vienna', displayName: 'Vienna', country: 'Austria' },
    { name: 'Stockholm', displayName: 'Stockholm', country: 'Sweden' },
    { name: 'Oslo', displayName: 'Oslo', country: 'Norway' },
    { name: 'Copenhagen', displayName: 'Copenhagen', country: 'Denmark' },
  ];

  useEffect(() => {
    // Load recent locations from localStorage
    const saved = localStorage.getItem('recentAirQualityLocations');
    if (saved) {
      try {
        setRecentLocations(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent locations:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: string) => {
    onLocationChange(location);
    setIsOpen(false);
    setQuery('');
    
    // Add to recent locations
    const updated = [location, ...recentLocations.filter(loc => loc !== location)].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem('recentAirQualityLocations', JSON.stringify(updated));
  };

  const getFilteredSuggestions = () => {
    if (!query.trim()) {
      return popularLocations;
    }
    
    return allLocations.filter(location => 
      location.displayName.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getCurrentLocationDisplay = () => {
    const location = allLocations.find(loc => loc.name === currentLocation);
    return location ? location.displayName : currentLocation.replace('-', ' ');
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-48"
        >
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-gray-800 font-medium truncate">
            {getCurrentLocationDisplay()}
          </span>
          <Search className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search cities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Recent Locations */}
            {!query && recentLocations.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Clock className="w-3 h-3" />
                  Recent
                </div>
                {recentLocations.map((locationName) => {
                  const location = allLocations.find(loc => loc.name === locationName);
                  const displayName = location ? location.displayName : locationName.replace('-', ' ');
                  const country = location ? location.country : '';
                  
                  return (
                    <button
                      key={locationName}
                      onClick={() => handleLocationSelect(locationName)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-800">{displayName}</div>
                        {country && <div className="text-xs text-gray-500">{country}</div>}
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-gray-100 my-2"></div>
              </div>
            )}

            {/* Popular/Filtered Suggestions */}
            <div className="p-2">
              {!query && (
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  <Star className="w-3 h-3" />
                  Popular Cities
                </div>
              )}
              
              {filteredSuggestions.length === 0 ? (
                <div className="px-3 py-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No cities found</p>
                  <p className="text-xs mt-1">Try searching for a different city</p>
                </div>
              ) : (
                filteredSuggestions.map((location) => (
                  <button
                    key={location.name}
                    onClick={() => handleLocationSelect(location.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left ${
                      location.name === currentLocation ? 'bg-blue-50 text-blue-800' : ''
                    }`}
                  >
                    <MapPin className={`w-4 h-4 ${location.popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-gray-800">{location.displayName}</div>
                      <div className="text-xs text-gray-500">{location.country}</div>
                    </div>
                    {location.popular && (
                      <Star className="w-3 h-3 text-yellow-500 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
