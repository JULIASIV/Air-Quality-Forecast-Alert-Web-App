import React, { useState } from 'react';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Link,
  Copy,
  Download,
  Camera,
  Hash,
  AtSign,
  MapPin,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface AirQualityData {
  location: string;
  aqi: number;
  category: string;
  timestamp: string;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
}

interface SocialMediaShareProps {
  airQualityData: AirQualityData;
  onClose?: () => void;
}

const SocialMediaShare: React.FC<SocialMediaShareProps> = ({
  airQualityData,
  onClose
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeHealthTip, setIncludeHealthTip] = useState(true);
  const [shareFormat, setShareFormat] = useState<'text' | 'image' | 'story'>('text');
  const [copySuccess, setCopySuccess] = useState(false);

  const getAQIEmoji = (aqi: number) => {
    if (aqi <= 50) return '🟢';
    if (aqi <= 100) return '🟡';
    if (aqi <= 150) return '🟠';
    if (aqi <= 200) return '🔴';
    if (aqi <= 300) return '🟣';
    return '🟫';
  };

  const getHealthTip = (aqi: number, category: string) => {
    if (aqi <= 50) return "Perfect day for outdoor activities! 🌟";
    if (aqi <= 100) return "Good air quality - enjoy the outdoors! 🚶‍♀️";
    if (aqi <= 150) return "Sensitive individuals should limit outdoor activities. ⚠️";
    if (aqi <= 200) return "Everyone should reduce outdoor activities. 🏠";
    if (aqi <= 300) return "Avoid outdoor activities - stay safe indoors! 🚨";
    return "Emergency conditions - stay indoors! 🆘";
  };

  const generateShareContent = (platform: string) => {
    const emoji = getAQIEmoji(airQualityData.aqi);
    const location = includeLocation ? airQualityData.location.replace('-', ' ') : 'My Location';
    const healthTip = includeHealthTip ? `\n\n💡 ${getHealthTip(airQualityData.aqi, airQualityData.category)}` : '';
    
    let hashtags = '';
    if (includeHashtags) {
      const baseHashtags = ['#AirQuality', '#Environment', '#Health'];
      const categoryHashtag = `#${airQualityData.category.replace(/\s+/g, '')}`;
      const locationHashtag = `#${airQualityData.location.replace('-', '')}`;
      hashtags = `\n\n${baseHashtags.join(' ')} ${categoryHashtag} ${locationHashtag}`;
    }

    let baseMessage = customMessage || 
      `${emoji} Air Quality Update for ${location}!\n\n` +
      `AQI: ${airQualityData.aqi} (${airQualityData.category})\n` +
      `PM2.5: ${airQualityData.pollutants.pm25} µg/m³\n` +
      `Updated: ${new Date(airQualityData.timestamp).toLocaleString()}${healthTip}${hashtags}`;

    // Platform-specific adjustments
    switch (platform) {
      case 'twitter':
        // Twitter character limit handling
        if (baseMessage.length > 280) {
          baseMessage = `${emoji} AQI: ${airQualityData.aqi} (${airQualityData.category}) in ${location}\n\n${getHealthTip(airQualityData.aqi, airQualityData.category)}\n\n#AirQuality #Health`;
        }
        return baseMessage;
      
      case 'facebook':
        return `${baseMessage}\n\n🌍 Stay informed about air quality in your area! Check your local AQI regularly and take care of your health.`;
      
      case 'instagram':
        return `${baseMessage}\n\n📸 Sharing awareness about air quality in our community! 🌱 #CleanAir #HealthyLiving`;
      
      case 'whatsapp':
        return `🌍 *Air Quality Alert*\n\n${baseMessage}\n\n_Stay safe and breathe easy!_ 💚`;
      
      case 'linkedin':
        return `Air Quality Awareness 🌍\n\n${baseMessage}\n\nHow is the air quality in your area? Let's discuss environmental health and its impact on our communities.`;
      
      default:
        return baseMessage;
    }
  };

  const shareToplatform = (platform: string) => {
    const content = generateShareContent(platform);
    const encodedContent = encodeURIComponent(content);
    const currentUrl = window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedContent}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${encodedContent}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedContent}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}&summary=${encodedContent}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${currentUrl}&text=${encodedContent}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = async () => {
    try {
      const content = generateShareContent('generic');
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadAsImage = () => {
    // Create a canvas to generate the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#1E40AF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    // Title
    ctx.fillText('Air Quality Report', canvas.width / 2, 80);
    
    // Location
    ctx.font = '32px Arial';
    ctx.fillText(airQualityData.location.replace('-', ' '), canvas.width / 2, 140);
    
    // AQI Circle
    const centerX = canvas.width / 2;
    const centerY = 280;
    const radius = 80;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    
    // AQI Number
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(airQualityData.aqi.toString(), centerX, centerY + 15);
    
    // Category
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.fillText(airQualityData.category, centerX, 400);
    
    // PM2.5 value
    ctx.font = '24px Arial';
    ctx.fillText(`PM2.5: ${airQualityData.pollutants.pm25} µg/m³`, centerX, 450);
    
    // Timestamp
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Updated: ${new Date().toLocaleDateString()}`, centerX, 520);
    
    // Download
    const link = document.createElement('a');
    link.download = `air-quality-${airQualityData.location}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500 hover:bg-pink-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Share2, color: 'bg-blue-700 hover:bg-blue-800' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          Share Air Quality Data
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Share Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Share Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setShareFormat('text')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              shareFormat === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Text Post
          </button>
          <button
            onClick={() => setShareFormat('image')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              shareFormat === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Image Card
          </button>
          <button
            onClick={() => setShareFormat('story')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              shareFormat === 'story' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Story
          </button>
        </div>
      </div>

      {/* Customization Options */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Include hashtags</span>
            <Hash className="w-4 h-4 text-gray-500" />
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Include location</span>
            <MapPin className="w-4 h-4 text-gray-500" />
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeHealthTip}
              onChange={(e) => setIncludeHealthTip(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Include health tip</span>
            <AtSign className="w-4 h-4 text-gray-500" />
          </label>
        </div>
      </div>

      {/* Custom Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message (Optional)</label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Add your own message..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Platform Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Share to Platform</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {platforms.map(platform => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                onClick={() => shareToplatform(platform.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg text-white transition-colors ${platform.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copySuccess ? 'Copied!' : 'Copy Text'}
        </button>
        
        <button
          onClick={downloadAsImage}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Image
        </button>
        
        <button
          onClick={() => {/* Implement screenshot functionality */}}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Screenshot
        </button>
      </div>

      {/* Preview */}
      {selectedPlatform && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Preview for {selectedPlatform}:</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
            {generateShareContent(selectedPlatform)}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 Sharing Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tag friends who care about environmental health</li>
          <li>• Use location-specific hashtags to reach local community</li>
          <li>• Include a call-to-action to check local air quality</li>
          <li>• Share during peak air quality hours for better visibility</li>
        </ul>
      </div>
    </div>
  );
};

export default SocialMediaShare;
