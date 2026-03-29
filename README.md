# LEDGER - Brutalist Expense Tracker

A fully functional, **PWA-enabled** Expense Tracker React app with a bold, distinctive UI theme inspired by **"brutalist financial ledger meets underground zine culture"**. Install it on your Windows PC or Android/iOS device for an app-like experience!

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)

### 1. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to **SQL Editor** in the left sidebar
3. Copy the contents of `supabase_schema.sql` and run it in the SQL Editor
4. This will create the `transactions` table with all necessary indexes and triggers

### 2. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── Toast.jsx         # Toast notification component
│   │   ├── SearchBar.jsx     # Search input component
│   │   └── ExportButton.jsx  # CSV export component
│   ├── App.jsx               # Main React component
│   ├── api.js                # Supabase API client
│   ├── supabaseClient.js     # Supabase client configuration
│   ├── main.jsx              # Entry point
│   └── index.css             # Base styles
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icon-*.png            # PWA icons
├── supabase_schema.sql       # Database schema
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── package.json
└── vercel.json               # Vercel deployment configuration
```

---

## 🗄️ Database Schema

The application uses a single `transactions` table with the following structure:

| Column          | Type         | Description                          |
|-----------------|--------------|--------------------------------------|
| id              | TEXT         | Primary key (unique ID)              |
| date            | DATE         | Transaction date                     |
| type            | TEXT         | 'income' or 'expense'                |
| category        | TEXT         | Category name (e.g., FOOD, SALARY)   |
| description     | TEXT         | Transaction description              |
| amount          | NUMERIC(12,2)| Transaction amount                   |
| month           | TEXT         | Month key (YYYY-MM format)           |
| **payment_method** | TEXT      | **NEW**: cash/card/upi/credit/etc.   |
| **notes**       | TEXT         | **NEW**: Additional notes            |
| **tags**        | TEXT         | **NEW**: Custom tags (comma-separated)|
| **receipt_image_url** | TEXT   | **NEW**: For future receipt uploads  |
| **is_recurring**| BOOLEAN      | **NEW**: Recurring transaction flag  |
| **user_id**     | UUID         | **NEW**: For future multi-user support|
| created_at      | TIMESTAMPTZ  | Auto-generated creation timestamp    |
| updated_at      | TIMESTAMPTZ  | Auto-updated on each modification    |

**Indexes:** Automatically created on `month`, `date`, `category`, `type`, `payment_method`, and composite indexes for optimized queries.

---

## ✨ Features

### Core Features
- ✅ **Transaction CRUD** - Create, Read, Update, Delete transactions
- ✅ **Income/Expense Tracking** - Separate categorization for income and expenses
- ✅ **Monthly Navigation** - Browse transactions by month
- ✅ **Category Filtering** - Filter by expense categories
- ✅ **Search** - Search transactions by description, category, or notes
- ✅ **Sorting** - Sort by date, category, description, or amount
- ✅ **Running Balance** - Real-time balance calculation
- ✅ **Category Breakdown** - Visual expense distribution by category

### New Features (v2.0)
- ✅ **Payment Method Tracking** - Track how you paid (Cash/Card/UPI/Credit/etc.)
- ✅ **Notes Field** - Add additional details to transactions
- ✅ **Tags Support** - Custom tags for flexible categorization
- ✅ **CSV Export** - Export transactions to CSV for analysis
- ✅ **Toast Notifications** - Visual feedback for all actions
- ✅ **PWA Support** - Install on Windows, Android, or iOS
- ✅ **Offline Support** - Service worker caching for reliability
- ✅ **Improved Mobile UI** - Optimized touch interactions and layout
- ✅ **Health Check** - Database connection verification on load

### Categories

**Expense Categories:**
- FOOD, TRANSPORT, UTILITIES, ENTERTAINMENT, HEALTH, OTHER

**Income Categories:**
- SALARY, FREELANCE, INVESTMENT, GIFT, RENTAL, OTHER

---

## 📱 PWA Installation

### On Windows
1. Open the app in Chrome or Edge
2. Click the **install icon** (⊕) in the address bar
3. Click **Install**
4. The app will appear in your Start Menu

### On Android
1. Open the app in Chrome
2. Tap the **menu** (⋮) → **Install app**
3. Confirm installation
4. The app will appear in your app drawer

### On iOS
1. Open the app in Safari
2. Tap the **Share** button
3. Scroll down and tap **Add to Home Screen**
4. The app will appear on your home screen

---

## 🎨 Design Features

- **Brutalist aesthetic**: Raw, typographic-driven, high-contrast
- **Color palette**: Off-white (#F5F0E8), Near-black (#0D0D0D), Acid yellow (#E8FF00), Blood red (#CC1400)
- **Typography**: Bebas Neue (headings) + Courier Prime (body)
- **No rounded corners**: Everything is sharp and rectangular
- **Grain texture overlay**: SVG noise filter for paper feel
- **Dot-grid pattern**: CSS radial-gradient background
- **Responsive design**: Optimized for mobile, tablet, and desktop

---

## 🚢 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Configure Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. In **Project Settings** → **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
3. Click **Deploy**

### 3. Alternative: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

---

## 📝 Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start Vite development server        |
| `npm run build` | Build for production                 |
| `npm run preview` | Preview production build locally   |

---

## 🧱 Tech Stack

- **Frontend**: React 18, Vite
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS-in-JS (no external UI libraries)
- **Fonts**: Bebas Neue, Courier Prime (Google Fonts)
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: Vercel

---

## 🔐 Security Notes

- Row Level Security (RLS) is **disabled** by default for public access
- For production with authentication, enable RLS and add user policies:
  ```sql
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Users can manage their own transactions"
    ON transactions
    FOR ALL
    USING (auth.uid() = user_id);
  ```

---

## 🐛 Troubleshooting

### "Database connection failed"

1. Check that `.env` file exists with correct values
2. Verify Supabase project is active
3. Ensure `supabase_schema.sql` has been run in Supabase SQL Editor

### Search not working

1. Search requires at least 2 characters
2. Search is debounced (300ms delay) for performance
3. Make sure transactions exist in the current month

### Export not downloading

1. Ensure you have transactions in the current view
2. Check browser popup blocker settings
3. Try a different browser if issue persists

### PWA not installing

1. Ensure the app is served over HTTPS (or localhost)
2. Check browser console for service worker errors
3. Clear browser cache and reload

---

## 📄 License

MIT

---

## 🙏 Credits

Inspired by brutalist design principles and zine culture. Built with ❤️ using React and Supabase.
