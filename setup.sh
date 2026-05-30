#!/bin/bash

# ADWAFLIX PREMIUM - Setup Script
# Production-Ready Streaming Platform

echo "🚀 ADWAFLIX PREMIUM 2.0 - Setup"
echo "================================"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js: $node_version"

# Check npm version
echo "📋 Checking npm version..."
npm_version=$(npm -v)
echo "   npm: $npm_version"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚙️  Creating .env.local..."
    cat > .env.local << 'EOF'
# ADWAFLIX PREMIUM Configuration
# Update these values with your own

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STREAMING_PROVIDER=vidsrc

# TMDB API (Get from https://www.themoviedb.org/settings/api)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
TMDB_SECRET_KEY=your_tmdb_secret_here

# Provider Settings
PROVIDER_TIMEOUT=30000
PROVIDER_RETRIES=3
PROVIDER_CACHE_TTL=86400

# Download Settings
MAX_CONCURRENT_DOWNLOADS=4
DOWNLOAD_CHUNK_SIZE=65536
DOWNLOAD_ENCRYPTION=aes-256-cbc

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=

# Enable/Disable Features
ENABLE_ANALYTICS=false
ENABLE_PLAYER_DEBUG=false
ENABLE_DOWNLOAD_ENCRYPTION=true
EOF
    echo "   ✓ Created .env.local (update with your API keys)"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p src/lib/providers
mkdir -p src/lib/download
mkdir -p src/components/ui
mkdir -p src/app/api
mkdir -p public/videos
mkdir -p .next/cache
echo "   ✓ Directories created"

# Build TypeScript
echo ""
echo "🔨 Building project..."
npm run build

# Show next steps
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Update .env.local with your TMDB API key"
echo "   2. Start development server: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "   - PRODUCTION_GUIDE.md - Complete setup guide"
echo "   - README.md - Project overview"
echo ""
echo "🎬 Ready to stream!"
