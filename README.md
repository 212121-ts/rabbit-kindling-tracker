# Rabbit Kindling Tracker

A beautiful web application for tracking rabbit breeding cycles with automatic date calculations and user accounts.

## Features

- 🔐 **User Accounts** - Private, secure accounts for each user
- 📅 **Automatic Date Calculations** - All important breeding dates calculated automatically
- 🐰 **Breeding Records** - Track doe, buck, breeding date, and notes
- 👶 **Litter Information** - Track litter size and gender counts
- 📄 **PDF Export** - Export all records to PDF
- 📱 **Mobile Responsive** - Works great on all devices
- 💾 **Persistent Storage** - SQLite database for reliable data storage

## Important Dates Calculated

- **Nestbox** - Day 28
- **Est. DOB** - Day 32
- **Turn Box** - Day 46
- **Remove Box** - Day 53
- **Rebreed** - Day 60
- **Wean Kits** - Day 72
- **Sex Date** - Day 85

## Deployment

This app is designed to be deployed on [Render.com](https://render.com).

### Environment Variables

Set the following in your Render dashboard:
- `JWT_SECRET` - A secure random string for JWT token signing

## Local Development

1. Clone this repository
2. Run `npm install`
3. Run `npm start`
4. Open http://localhost:3000

## Technologies Used

- Node.js & Express
- SQLite Database
- JWT Authentication
- Vanilla JavaScript Frontend
- jsPDF for PDF Generation

## License

MIT License

## Author

Created with ❤️ for rabbit breeders