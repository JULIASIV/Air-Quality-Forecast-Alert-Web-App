#!/bin/bash

# NASA Space Apps Challenge 2025
# Air Quality Forecast & Alert System
# Deployment Script

set -e

echo "🚀 Starting deployment for NASA Space Apps Challenge 2025..."
echo "Project: Air Quality Forecast & Alert System"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="air-quality-forecast-app"
VERSION=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    if [ ! -f ".env" ]; then
        warning ".env file not found. Copying from .env.example..."
        if [ -f "server/.env.example" ]; then
            cp server/.env.example .env
            warning "Please edit .env file with your configuration before continuing."
            read -p "Press enter to continue after editing .env file..."
        else
            error ".env.example file not found. Please create .env file manually."
        fi
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    mkdir -p $BACKUP_DIR
    
    if docker-compose ps | grep -q "Up"; then
        log "Creating database backup..."
        docker-compose exec mongodb mongodump --host localhost --port 27017 \
            --username admin --password password123 \
            --authenticationDatabase admin \
            --db air-quality-app \
            --out /data/backup_${VERSION}
        
        docker cp air-quality-mongodb:/data/backup_${VERSION} $BACKUP_DIR/
        success "Database backup created: $BACKUP_DIR/backup_${VERSION}"
    fi
}

# Build images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker-compose build backend
    
    # Build frontend
    log "Building frontend image..."
    docker-compose build frontend
    
    success "Docker images built successfully"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose down
    
    # Start new services
    log "Starting services..."
    docker-compose up -d mongodb redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Start backend and frontend
    docker-compose up -d backend frontend nginx
    
    # Start monitoring (optional)
    if [ "$1" = "--monitoring" ]; then
        log "Starting monitoring services..."
        docker-compose --profile monitoring up -d prometheus grafana
    fi
    
    success "Services deployed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            success "Backend service is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            error "Backend service health check failed"
        fi
        
        log "Waiting for backend service... (attempt $i/30)"
        sleep 10
    done
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend service is healthy"
    else
        warning "Frontend service may not be fully ready yet"
    fi
    
    # Show service status
    log "Service status:"
    docker-compose ps
}

# Performance optimization
optimize_performance() {
    log "Applying performance optimizations..."
    
    # MongoDB indexes
    log "Creating database indexes..."
    docker-compose exec mongodb mongo air-quality-app --eval "
        db.tempo_data.createIndex({ 'latitude': 1, 'longitude': 1, 'timestamp': -1 });
        db.ground_station_data.createIndex({ 'latitude': 1, 'longitude': 1, 'timestamp': -1 });
        db.weather_data.createIndex({ 'latitude': 1, 'longitude': 1, 'timestamp': -1 });
        db.alerts.createIndex({ 'coordinates': '2dsphere' });
        db.users.createIndex({ 'email': 1 }, { unique: true });
    "
    
    success "Performance optimizations applied"
}

# Setup monitoring
setup_monitoring() {
    if [ "$1" = "--monitoring" ]; then
        log "Setting up monitoring dashboards..."
        
        # Wait for Grafana to be ready
        sleep 60
        
        # Import dashboards (if available)
        if [ -d "monitoring/grafana/dashboards" ]; then
            log "Importing Grafana dashboards..."
            # Dashboard import logic would go here
        fi
        
        success "Monitoring setup completed"
        log "Grafana dashboard: http://localhost:3030 (admin/admin123)"
        log "Prometheus: http://localhost:9090"
    fi
}

# Show deployment summary
show_summary() {
    log "Deployment Summary"
    echo "===================="
    echo "🌍 Air Quality Forecast & Alert System"
    echo "🏆 NASA Space Apps Challenge 2025"
    echo "📅 Deployed: $(date)"
    echo "🏷️  Version: $VERSION"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend:    http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/api/health"
    echo ""
    
    if [ "$1" = "--monitoring" ]; then
        echo "📊 Monitoring URLs:"
        echo "   Grafana:    http://localhost:3030"
        echo "   Prometheus: http://localhost:9090"
        echo ""
    fi
    
    echo "📡 Data Sources:"
    echo "   - NASA TEMPO Satellite Data"
    echo "   - OpenAQ Ground Stations"
    echo "   - WHO Air Pollution Database"
    echo "   - Weather APIs"
    echo ""
    echo "🎯 Key Features:"
    echo "   - Real-time air quality monitoring"
    echo "   - ML-powered 24-hour forecasting"
    echo "   - Health-based alert system"
    echo "   - Multi-stakeholder dashboard"
    echo ""
    success "Deployment completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Configure your NASA API credentials in .env"
    echo "2. Set up email notifications (SMTP settings)"
    echo "3. Test the forecast and alert systems"
    echo "4. Monitor application health and performance"
}

# Main deployment flow
main() {
    echo "🛰️ NASA TEMPO Air Quality Monitoring System"
    echo "============================================="
    
    check_prerequisites
    create_backup
    build_images
    deploy_services "$1"
    health_check
    optimize_performance
    setup_monitoring "$1"
    show_summary "$1"
}

# Handle command line arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [--monitoring] [--help]"
        echo ""
        echo "Options:"
        echo "  --monitoring    Deploy with monitoring stack (Prometheus + Grafana)"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Environment:"
        echo "  Make sure to configure .env file before deployment"
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac
