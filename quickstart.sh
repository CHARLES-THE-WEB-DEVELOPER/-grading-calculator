#!/bin/bash
# Quick Start Script for Grading Calculator

echo "🚀 Grading Calculator - Quick Start"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 16+ first."
  exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
  echo "❌ Failed to install dependencies"
  exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Choose deployment mode
echo "How would you like to run the application?"
echo "1) Development mode (with auto-reload)"
echo "2) Production mode (clustering enabled)"
echo "3) Docker (full stack with 4 instances)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo "🔄 Starting in development mode..."
    npm run dev
    ;;
  2)
    echo "⚡ Starting in production mode (clustering)..."
    NODE_ENV=production npm start
    ;;
  3)
    echo "🐳 Starting Docker Compose..."
    # Check if Docker is installed
    if ! command -v docker-compose &> /dev/null; then
      echo "❌ Docker Compose is not installed."
      echo "Visit: https://docs.docker.com/compose/install/"
      exit 1
    fi
    
    docker-compose up -d
    
    echo "✅ Docker containers started!"
    echo ""
    echo "Services:"
    echo "  - Application (4 instances): http://localhost:3000"
    echo "  - Nginx Reverse Proxy: http://localhost"
    echo "  - Redis: redis://localhost:6379"
    echo "  - PostgreSQL: postgresql://localhost:5432"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    echo "View logs: docker-compose logs -f"
    echo "Stop: docker-compose down"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📝 Next steps:"
echo "  - Visit http://localhost:3000"
echo "  - Add some courses and calculate GPA"
echo "  - Check DEPLOYMENT.md for scaling to millions of users"
echo ""
echo "📚 Documentation:"
echo "  - README.md: Overview and features"
echo "  - DEPLOYMENT.md: Production deployment guide"
echo "  - index.html: HTML structure"
echo ""
echo "🎯 Testing at scale:"
echo "  - Use docker-compose for 200K concurrent users"
echo "  - Use Kubernetes for 1M+ concurrent users"
echo ""
