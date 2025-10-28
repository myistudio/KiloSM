# Satta Matka Website with Admin Panel

A comprehensive, production-ready Satta Matka website built with Next.js 14+, featuring a complete admin panel, real-time results, and mobile-first responsive design.

## 🌟 Features

### ✅ Complete Feature Set
- **🔐 Admin Authentication** - Secure login with role-based access control
- **📊 Market Management** - Full CRUD operations with scheduling
- **🎯 Result Management** - Validation, auto-calculation, and bulk entry
- **🎨 Content Management** - Manage all 20+ website sections
- **🎭 Theme Customization** - Live preview color palette editor
- **🌐 Website Frontend** - Dark theme, mobile-first responsive design
- **⚡ Real-time Features** - Live updates and WebSocket-like functionality
- **📱 Mobile Optimized** - 91% mobile user compatibility
- **🚀 Production Ready** - Complete deployment configuration

### 🛠️ Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: Shadcn/ui component library
- **Real-time**: Custom real-time service with React hooks
- **Deployment**: Vercel optimized configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd satta-matka-website
npm install
```

### 2. Database Setup
```bash
# Make sure PostgreSQL is running
# Run the database setup script
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.local .env.local

# Edit .env.local with your database credentials:
# DATABASE_URL="postgresql://username:password@localhost:5432/satta_matka_dev"
# NEXTAUTH_SECRET="your-secret-key"
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Your Site
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login

**Default Admin Credentials:**
- Email: `admin@sattamatka.com`
- Password: `password123`

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with initial data
npm run db:studio       # Open Prisma Studio

# Testing & Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks

# Deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh     # Run deployment checks

# Testing
chmod +x scripts/test.sh
./scripts/test.sh        # Run comprehensive tests
```

## 🏗️ Project Structure

```
satta-matka-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (website)/         # Public website pages
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── ui/                # Reusable UI components
│   │   └── providers/         # Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── generated/             # Generated Prisma client
├── prisma/                    # Database schema and migrations
├── scripts/                   # Deployment and setup scripts
├── public/                    # Static assets
└── [config files]             # Next.js, Tailwind, etc.
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**:
   ```bash
   npx vercel
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Random 32-character string
   - `NEXTAUTH_URL` - Your production URL
   - `UPSTASH_REDIS_REST_URL` - Redis URL (optional)
   - `UPSTASH_REDIS_REST_TOKEN` - Redis token (optional)

3. **Deploy**:
   ```bash
   npx vercel --prod
   ```

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up production database** and update `DATABASE_URL`

3. **Configure environment variables** for your hosting platform

4. **Deploy the `.next` folder** to your hosting provider

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ |
| `NEXTAUTH_URL` | Base URL of your application | ✅ |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL for caching | ❌ |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | ❌ |
| `EMAIL_SERVER_*` | SMTP settings for notifications | ❌ |

### Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - Admin users and authentication
- `markets` - Market information and schedules
- `market_results` - Daily results with validation
- `sections` - Website section configurations
- `content_blocks` - Editable content for each section
- `theme_settings` - Color palette and styling
- `activity_logs` - Audit trail for admin actions

## 🎮 Admin Panel Features

### Market Management
- Create, edit, delete markets
- Set open/close/result times
- Configure operating days
- Bulk operations support

### Result Management
- Individual result entry with validation
- Auto-calculation of jodi and panel
- Bulk result entry for multiple markets
- Historical result viewing

### Content Management
- Toggle all 20+ sections on/off
- Edit content blocks (TEXT, HTML, JSON, LINK)
- Manage FAQ and Q&A content
- Section ordering and organization

### Theme Customization
- Live color palette editor
- Color presets for quick setup
- Real-time preview with device selection
- Save/load custom themes

## 🌐 Website Features

### Public Interface
- **Mobile-first responsive design**
- **Dark theme** with gradient backgrounds
- **Live clock** showing IST time
- **Real-time results** with animations
- **Astrology lucky numbers** with live updates
- **Market timing information**
- **Notice board** for announcements

### Real-time Features
- Live result updates every 30 seconds
- Market status tracking
- System health monitoring
- Animated UI updates

## 🔒 Security

- **Input validation** with Zod schemas
- **SQL injection prevention** with Prisma ORM
- **XSS protection** with proper sanitization
- **CSRF protection** with NextAuth.js
- **Rate limiting** on API endpoints
- **Secure authentication** with bcrypt password hashing

## 📱 Mobile Optimization

- **91% mobile user support** as requested
- **Touch-friendly interface** with appropriate button sizes
- **Fast loading** on mobile networks
- **Responsive breakpoints** for all screen sizes
- **Progressive Web App** ready architecture

## 🧪 Testing

Run the comprehensive test suite:
```bash
./scripts/test.sh
```

This includes:
- Environment variable validation
- Database connection testing
- TypeScript compilation checks
- Build process verification
- Linting and code quality checks

## 📊 Performance

- **Server-Side Rendering** for dynamic content
- **Static Generation** for stable pages
- **Redis caching** for improved performance
- **Image optimization** with Next.js Image
- **Code splitting** for faster loading
- **CDN optimization** for static assets

## 🤝 Support

For issues and questions:
1. Check the troubleshooting guide below
2. Review the deployment documentation
3. Check existing issues on GitHub

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Ensure PostgreSQL is running
pg_isready -h localhost -p 5432

# Check your DATABASE_URL format
echo $DATABASE_URL
```

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Authentication Issues**
```bash
# Regenerate NextAuth secret
openssl rand -base64 32

# Clear browser cookies and try again
```

## 📄 License

This project is built for the Satta Matka platform. Please ensure compliance with local regulations regarding online gaming and gambling content.

---

**🎯 Your Satta Matka website is ready for production deployment!**
