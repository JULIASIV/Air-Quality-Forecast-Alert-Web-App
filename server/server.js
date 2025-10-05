const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('ws');
require('dotenv').config();

// Import routes
const airQualityRoutes = require('./routes/airQuality');
const weatherRoutes = require('./routes/weather');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');

// Import services
const DataCollectorService = require('./services/DataCollectorService');
const ForecastService = require('./services/ForecastService');
const AlertService = require('./services/AlertService');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://data.larc.nasa.gov", "https://api.openaq.org", "https://api.openweathermap.org"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/air-quality-app')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV
    }
  });
});

// API Routes
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);

// NASA TEMPO data endpoint
app.get('/api/nasa/tempo/:parameter', async (req, res) => {
  try {
    const { parameter } = req.params;
    const { lat, lon, date } = req.query;
    
    const validParameters = ['no2', 'hcho', 'aerosol', 'pm', 'o3'];
    if (!validParameters.includes(parameter)) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    
    const dataCollector = new DataCollectorService();
    const tempoData = await dataCollector.fetchTempoData(parameter, { lat, lon, date });
    
    res.json({
      source: 'NASA TEMPO',
      parameter: parameter.toUpperCase(),
      data: tempoData,
      timestamp: new Date().toISOString(),
      citation: 'NASA Tropospheric Emissions: Monitoring of Pollution (TEMPO)'
    });
  } catch (error) {
    console.error('TEMPO API Error:', error);
    res.status(500).json({ error: 'Failed to fetch TEMPO data' });
  }
});

// Real-time forecast endpoint
app.get('/api/forecast/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { hours = 24 } = req.query;
    
    const forecastService = new ForecastService();
    const forecast = await forecastService.generateForecast(location, parseInt(hours));
    
    res.json({
      location,
      forecast,
      generated_at: new Date().toISOString(),
      data_sources: [
        'NASA TEMPO',
        'OpenAQ Ground Stations',
        'OpenWeatherMap',
        'WHO Air Pollution Database'
      ]
    });
  } catch (error) {
    console.error('Forecast Error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new Server({ server });

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('🔌 Client connected to WebSocket');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe') {
        ws.location = data.location;
        console.log(`📍 Client subscribed to location: ${data.location}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected from WebSocket');
  });
});

// Initialize services
const dataCollector = new DataCollectorService();
const alertService = new AlertService();

// Start data collection
dataCollector.startDataCollection();

// Start alert monitoring
alertService.startAlertMonitoring();

// Broadcast real-time updates to connected clients
setInterval(() => {
  wss.clients.forEach(async (client) => {
    if (client.readyState === 1 && client.location) { // OPEN
      try {
        const latestData = await dataCollector.getLatestData(client.location);
        client.send(JSON.stringify({
          type: 'air-quality-update',
          location: client.location,
          data: latestData,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('WebSocket broadcast error:', error);
      }
    }
  });
}, 60000); // Update every minute

server.listen(PORT, () => {
  console.log(`\n🚀 NASA Space Apps - Air Quality Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 WebSocket server ready for real-time connections\n`);
});

module.exports = { app, server, wss };
