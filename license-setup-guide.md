# License Key System Setup Guide

## 🔑 What You Now Have

Your Rabbit Tracker now includes:
- **License key requirement** for new registrations
- **Admin panel** for managing keys and users
- **Key generation** tools
- **User tracking** to see who's using your app

## 📁 Updated File Structure

```
rabbit-kindling-tracker/
├── server.js          (UPDATED - with license system)
├── package.json       (same as before)
├── .gitignore        (same as before)
├── README.md         (same as before)
├── generate-keys.js  (NEW - key generator script)
├── public/
│   ├── index.html    (UPDATED - with license field)
│   └── admin.html    (NEW - admin panel)
```

## 🚀 Setup Instructions

### 1. Update Your Files

Replace your existing files with:
- New `server.js` (from "Updated server.js with License Key System")
- Updated `index.html` (from "Rabbit Kindling Tracker with User Accounts" - now includes license field)
- Add new `admin.html` file to the public folder
- Add `generate-keys.js` to root folder

### 2. Test Locally

```bash
# Install dependencies
npm install

# Generate some test keys
node generate-keys.js 5 "Test keys"

# Start server
npm start

# Open http://localhost:3000
# Open http://localhost:3000/admin.html for admin panel
```

### 3. Deploy to Render

1. Commit and push all changes to GitHub:
```bash
git add .
git commit -m "Add license key system"
git push
```

2. Add environment variable in Render dashboard:
   - Go to your service → Environment
   - Add: `ADMIN_PASSWORD` = `your-secure-admin-password`

3. Render will automatically redeploy

## 💻 Using the Admin Panel

### Access Admin Panel
1. Go to `https://your-app.onrender.com/admin.html`
2. Enter your admin password
3. You'll see:
   - Statistics dashboard
   - License key generator
   - All keys with status
   - Registered users list

### Generate License Keys
1. Click "Generate Keys" in admin panel
2. Enter number of keys and optional notes
3. Keys are displayed and saved to database
4. Download keys as text file

### From Command Line (on your local machine)
```bash
# Generate 10 keys
node generate-keys.js 10 "January 2025 batch"

# Generate 5 keys with custom note
node generate-keys.js 5 "Early bird special"
```

## 💰 Sales Workflow

### 1. Customer Purchase Flow
1. Customer pays you via PayPal/Venmo/Stripe/etc
2. You generate a license key
3. Email key to customer with instructions
4. Customer registers with their key

### 2. License Key Email Template
```
Subject: Your Rabbit Kindling Tracker License Key

Thank you for purchasing Rabbit Kindling Tracker!

Your license key is: XXXX-XXXX-XXXX-XXXX

To get started:
1. Visit https://your-app.onrender.com
2. Click "Register"
3. Enter your email and the license key above
4. Create a password
5. Start tracking your rabbitry!

This license provides lifetime access for one user account.

If you have any questions, please reply to this email.

Happy breeding!
```

### 3. Batch Generation for Sales
```bash
# Generate keys for a promotion
node generate-keys.js 50 "Black Friday 2025"

# Keys are saved to a timestamped file
# Upload to your preferred sales platform
```

## 🔒 Security Features

- **One key, one account** - Each key can only be used once
- **Key validation** - Invalid keys are rejected
- **Admin protection** - Admin panel requires password
- **User isolation** - Each user only sees their own data

## 📊 Admin Features

### View Statistics
- Total users registered
- Total keys generated
- Keys used vs available
- Total breeding records

### Manage Keys
- See all keys and their status
- Revoke unused keys if needed
- Track which email used each key
- Add notes to key batches

### Monitor Users
- See all registered users
- View registration dates
- Track number of records per user

## 🎯 Pricing Strategy

### Recommended Pricing
- **Regular Price**: $29-39
- **Launch Price**: $19 (first 50 customers)
- **Bundle Deal**: 3 licenses for $49

### Sales Channels
1. **Direct Sales**: PayPal invoice + manual key delivery
2. **Gumroad**: Set up product, deliver keys as text file
3. **Your Website**: Add a simple landing page with PayPal button

## 🚨 Important Notes

1. **Backup Your Database**: The SQLite database (`rabbit_tracker.db`) contains all keys and user data
2. **Keep Keys Secure**: Don't post unused keys publicly
3. **Track Sales**: Match payment receipts to license keys
4. **Customer Support**: Keep a record of which customer got which key

## 📈 Scaling Tips

When you're ready to automate:
1. Integrate Stripe for automatic key delivery
2. Add email notifications for important dates
3. Create a landing page with feature list
4. Add testimonials from happy customers

## 🛠️ Troubleshooting

### "Invalid license key" error
- Check key format: XXXX-XXXX-XXXX-XXXX
- Ensure key exists in database
- Verify key hasn't been used

### Can't access admin panel
- Verify ADMIN_PASSWORD is set in Render
- Check you're using https://
- Clear browser cache

### Generate keys not working
- Ensure database has write permissions
- Check generate-keys.js is in root directory
- Verify Node.js is installed locally

## 🎉 You're Ready to Sell!

Your Rabbit Kindling Tracker is now a commercial product with:
- License key protection
- User management
- Admin controls
- Professional deployment

Start with friends and local rabbit breeding communities, then expand from there!

---

Need help? Your app is professionally built and ready for customers. Good luck with your sales!