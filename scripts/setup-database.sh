#!/bin/bash

# Satta Matka Database Setup Script
echo "🚀 Setting up Satta Matka database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Create database
echo "📦 Creating database..."
createdb satta_matka_dev

if [ $? -eq 0 ]; then
    echo "✅ Database 'satta_matka_dev' created successfully"
else
    echo "⚠️  Database might already exist, continuing..."
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to run migrations"
    exit 1
fi

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Failed to seed database"
    exit 1
fi

# Generate Prisma client
echo "⚡ Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo "📋 Next steps:"
echo "   1. Update .env.local with your database credentials"
echo "   2. Run 'npm run dev' to start development server"
echo "   3. Visit http://localhost:3000 to see your site"
echo "   4. Visit http://localhost:3000/admin/login to access admin panel"
echo ""
echo "🔑 Default admin credentials:"
echo "   Email: admin@sattamatka.com"
echo "   Password: password123"