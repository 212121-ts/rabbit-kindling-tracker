# 🐰 Rabbit Kindling Tracker

A professional web application for managing rabbit breeding cycles with automatic date calculations, secure user accounts, and comprehensive record keeping.

## 🌟 Features

### Core Functionality
- **📅 Automatic Date Calculations** - All breeding dates calculated automatically from breeding date
- **🔐 Secure User Accounts** - Private accounts with encrypted passwords and license key authentication
- **📊 Breeding Records** - Track doe, buck, breeding dates, and notes
- **👶 Litter Management** - Record litter size and gender distribution
- **📄 PDF Export** - Generate professional PDF reports of all records
- **📱 Mobile Responsive** - Works on all devices
- **💾 Persistent Data** - PostgreSQL database ensures data is never lost

### Calculated Breeding Dates
- **Nestbox** - Day 28 (Prepare for kindling)
- **Est. DOB** - Day 32 (Expected birth date)
- **Turn Box** - Day 46 (Turn nest box on side)
- **Remove Box** - Day 53 (Remove nest box)
- **Rebreed** - Day 60 (Doe ready for next breeding)
- **Wean Kits** - Day 72 (Separate from mother)
- **Sex Date** - Day 85 (Determine gender & separate)

### License System
- **🔑 License Key Protection** - Paid access via unique license keys
- **👨‍💼 Admin Dashboard** - Complete control over keys and users
- **📊 Usage Analytics** - Track registrations and usage
- **💰 Commercial Ready** - Built for selling access

## 🚀 Live Demo

Visit: [https://rabbit-kindling-tracker.onrender.com](https://rabbit-kindling-tracker.onrender.com)

*Note: Requires a license key to register. Contact for demo access.*

## 💻 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Free tier on Render-Limited Time)
- **Authentication**: JWT tokens, bcrypt encryption
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PDF Generation**: jsPDF
- **Hosting**: Render.com (Free tier)

## 🛠️ Installation & Deployment

### Prerequisites
- GitHub account
- Render.com account
- Node.js 14+ (for local development)

### Quick Deploy to Render

1. **Fork/Clone this repository**
   ```bash
   git clone https://github.com/your-username/rabbit-kindling-tracker.git
   cd rabbit-kindling-tracker
   ```

2. **Create PostgreSQL Database on Render**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Name: `rabbit-tracker-db`
   - Plan: Free
   - Click "Create Database"

3. **Deploy Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `rabbit-kindling-tracker`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

4. **Connect Database**
   - In your web service, go to "Environment"
   - Add environment variable:
     - Key: `DATABASE_URL`
     - Value: (Copy "Internal Database URL" from your PostgreSQL dashboard)

5. **Set Admin Password**
   - Add another environment variable:
     - Key: `ADMIN_PASSWORD`
     - Value: `your-secure-admin-password`

6. **Set JWT Secret**
   - Add environment variable:
     - Key: `JWT_SECRET`
     - Value: `your-random-jwt-secret-key`

7. **Deploy** - Render will automatically deploy your app!

### Local Development

```bash
# Clone repository
git clone https://github.com/your-username/rabbit-kindling-tracker.git
cd rabbit-kindling-tracker

# Install dependencies
npm install

# Set up local PostgreSQL or use Docker
docker run --name rabbit-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
export ADMIN_PASSWORD="admin123"
export JWT_SECRET="dev-secret-key"

# Run the server
npm start

# Access at http://localhost:3000
```

## 📁 Project Structure

```
rabbit-kindling-tracker/
├── server.js             # Express server with PostgreSQL
├── package.json         # Dependencies
├── generate-keys.js     # Standalone key generator
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── public/             # Frontend files
    ├── index.html      # Main application
    └── admin.html      # Admin dashboard
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `ADMIN_PASSWORD` | Password for admin panel | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port (default: 3000) | No |

## 📖 Usage Guide

### For Administrators

1. **Access Admin Panel**
   ```
   https://your-app.onrender.com/admin.html
   ```

2. **Generate License Keys**
   - Login with your admin password
   - Click "Generate Keys"
   - Enter quantity and optional notes
   - Download or copy keys

3. **Monitor Usage**
   - View total users, keys, and records
   - See which keys are used
   - Track user registrations

### For Users

1. **Purchase License** - Buy from vendor
2. **Register Account** - Use license key to create account
3. **Add Breeding Records** - Track your rabbits
4. **View Calculations** - See all important dates
5. **Update Litter Info** - Add kit details after birth
6. **Export Records** - Download PDF reports

### License Key Management

```bash
# Generate keys locally (optional)
node generate-keys.js 10 "January 2025 batch"

# Or use admin panel at /admin.html
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **License Validation** - Server-side key verification
- **SQL Injection Protection** - Parameterized queries
- **Admin Protection** - Separate authentication
- **HTTPS Only** - Enforced by Render

## 🚀 Scaling & Performance

The app is designed to scale:

- **Free Tier Limits**:
  - PostgreSQL: 1GB storage (~100,000+ records)
  - Web Service: Spins down after 15 min inactivity
  - First request after idle: ~30 seconds

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 💰 Business Model

- **License Keys**: One-time purchase per user
- **Suggested Pricing**: $19-39 per license
- **Volume Discounts**: Optional bulk pricing
- **Support**: Email support included

## 🐛 Troubleshooting

### Common Issues

**"Invalid credentials" after deployment**
- Database was recreated
- Generate new license key and re-register

**"Invalid license key format"**
- Ensure format: `XXXX-XXXX-XXXX-XXXX`
- Only use A-Z and 0-9 characters

**Slow first load**
- Normal on free tier (cold start)
- Upgrade to paid tier for instant response

**Can't access admin panel**
- Check ADMIN_PASSWORD environment variable
- Clear browser cache and try again

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- **Documentation**: This README

## 🎉 Success Stories

> Let me know your story!

---

**Built with ❤️ for the rabbit breeding community**

*Version 2.0 - Now with PostgreSQL for 100% data persistence!*