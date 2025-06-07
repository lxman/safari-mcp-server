#!/bin/bash

# Safari MCP Server Launcher
# Quick script to build and run the server

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🦄 Safari MCP Server Launcher"
echo "================================"

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "❌ Error: This server only works on macOS"
  exit 1
fi

# Check if built
if [ ! -d "build" ] || [ ! -f "build/index.js" ]; then
  echo "📦 Building project..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
  fi
fi

echo "🚀 Starting Safari MCP Server..."
echo "   Press Ctrl+C to stop"
echo "   Logs will appear below:"
echo ""

# Run the server
npm start
