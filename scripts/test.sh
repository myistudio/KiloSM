#!/bin/bash

# Satta Matka Testing Script
echo "🧪 Running comprehensive tests..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "🔍 1. Environment Check"
echo "   Node.js version: $(node --version)"
echo "   npm version: $(npm --version)"

# Check required environment variables
echo ""
echo "🔐 2. Environment Variables Check"
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "   ✅ $var is set"
    else
        echo "   ⚠️  $var is not set"
    fi
done

echo ""
echo "🏗️  3. Database Connection Test"
# Test database connection
npx prisma db ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
fi

echo ""
echo "⚡ 4. Build Test"
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
    rm build.log
else
    echo "   ❌ Build failed. Check build.log for details."
    exit 1
fi

echo ""
echo "🔍 5. TypeScript Check"
npx tsc --noEmit > typescript.log 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ TypeScript check passed"
    rm typescript.log
else
    echo "   ❌ TypeScript errors found. Check typescript.log for details."
    exit 1
fi

echo ""
echo "🧹 6. Linting Check"
npm run lint > lint.log 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Linting passed"
    rm lint.log
else
    echo "   ⚠️  Linting issues found. Check lint.log for details."
    echo "   (Not blocking deployment, but consider fixing)"
fi

echo ""
echo "🚀 7. Starting Test Server"
echo "   Starting server on http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""
echo "📋 Test Checklist:"
echo "   □ Admin login works (admin@sattamatka.com / password123)"
echo "   □ Market management functions properly"
echo "   □ Result entry and validation works"
echo "   □ Content management is functional"
echo "   □ Theme customization works"
echo "   □ Real-time features are operational"
echo "   □ Mobile responsiveness is good"
echo "   □ All 20 sections are accessible"
echo ""

# Start the development server
npm run dev