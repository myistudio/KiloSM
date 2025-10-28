#!/bin/bash

# Satta Matka Deployment Script
echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Run type checking
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix them before deploying."
    exit 1
fi

# Run linting
echo "🧹 Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found. Consider fixing them for better code quality."
    echo "   Continuing deployment..."
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Run tests if they exist
if [ -f "jest.config.js" ] || [ -f "vitest.config.ts" ]; then
    echo "🧪 Running tests..."
    npm test

    if [ $? -ne 0 ]; then
        echo "❌ Tests failed"
        exit 1
    fi
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps for deployment:"
echo "   1. Vercel: Run 'vercel --prod' or connect to Vercel dashboard"
echo "   2. Manual hosting: Upload the contents of '.next' folder"
echo "   3. Docker: Use the Dockerfile in the project root"
echo ""
echo "🔧 Environment variables to set:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - NEXTAUTH_SECRET (random 32-character string)"
echo "   - NEXTAUTH_URL (your production URL)"
echo "   - UPSTASH_REDIS_REST_URL (Redis URL for caching)"
echo "   - UPSTASH_REDIS_REST_TOKEN (Redis token)"
echo ""
echo "🎯 Your Satta Matka website is ready for production!"