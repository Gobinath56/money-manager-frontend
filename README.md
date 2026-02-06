# Money Manager Frontend

A modern, responsive web application for managing personal finances built with React and Tailwind CSS.

## 🚀 Features

- ✅ **Dashboard with 3 Sections**: Monthly, Weekly, and Yearly financial overviews
- ✅ **Transaction Management**: Add, edit, and delete income/expense transactions
- ✅ **12-Hour Edit Restriction**: Transactions can only be edited within 12 hours of creation
- ✅ **Advanced Filtering**: Filter by division (Office/Personal), category, and date range
- ✅ **Category Summary**: Visual pie chart showing expense distribution by category
- ✅ **Account Transfers**: Transfer money between different accounts
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ✅ **Beautiful UI**: Modern design with Tailwind CSS and smooth animations

## 📋 Prerequisites

- Node.js 16+ and npm
- Backend API running (Spring Boot backend on port 5000)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/money-manager-frontend.git
cd money-manager-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Backend URL

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:

```env
# For local development
REACT_APP_API_URL=http://localhost:5000/api

# For production (replace with your deployed backend)
# REACT_APP_API_URL=https://your-backend-url.com/api
```

### 4. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🎯 Usage Guide

### Adding Transactions

1. Click the **"+ Add Transaction"** button in the header
2. Choose between **Income** or **Expense** tab
3. Fill in the required fields:
   - Amount (required)
   - Description (required)
   - Category (dropdown - different options for income/expense)
   - Division (Office or Personal)
   - Date & Time (calendar picker)
4. Click **"+ Add"** to save

### Editing Transactions

1. Find the transaction in the history table
2. Click the **Edit** icon (pencil)
3. **Within 12 hours**: Modal opens for editing
4. **After 12 hours**: Error message appears (backend restriction)

### Deleting Transactions

1. Click the **Delete** icon (trash)
2. Confirm deletion
3. Transaction is permanently removed

### Filtering Transactions

1. Use the **Filters** panel above the transaction table
2. Select filters:
   - Division: Office, Personal, or All
   - Category: Any category or All
   - Date Range: Start and End dates
3. Click **"Apply Filters"**
4. Click **"Reset Filters"** to clear all filters

### Account Transfers

1. Click the **"Transfer"** button in the header
2. Select **From Account** (source)
3. Select **To Account** (destination)
4. Enter the **Amount**
5. Click **"💸 Transfer"**

## 🏗️ Project Structure

```
src/
├── components/
│   ├── AccountTransferModal.js    # Transfer between accounts
│   ├── CategorySummary.js         # Pie chart for expense categories
│   ├── DashboardCards.js          # Monthly/Weekly/Yearly cards
│   ├── FilterPanel.js             # Transaction filters
│   ├── TransactionModal.js        # Add/Edit transaction modal
│   └── TransactionTable.js        # Transaction history table
├── services/
│   └── api.js                     # API service for backend calls
├── utils/
│   └── helpers.js                 # Utility functions
├── App.js                         # Main application component
├── index.js                       # Entry point
└── index.css                      # Tailwind CSS & custom styles
```

## 🎨 Technology Stack

- **React 18** - UI library
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React DatePicker** - Date and time selection
- **React Icons** - Beautiful icon library
- **Recharts** - Charting library for category summary

## 🔌 API Integration

The frontend connects to these backend endpoints:

### Transaction Endpoints
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/dashboard` - Get dashboard data
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction (12-hour restriction)
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/filter` - Filter transactions

### Account Endpoints
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `POST /api/accounts/transfer` - Transfer between accounts

## 🎭 Categories

### Income Categories
- 💰 Salary
- 💼 Freelance
- 📈 Investment
- ➕ Other

### Expense Categories
- ⛽ Fuel
- 🎬 Movie
- 🍔 Food
- 💳 Loan
- 🏥 Medical
- ➕ Other

## 🏢 Divisions
- Office (for work-related transactions)
- Personal (for personal transactions)

## 🚨 Important Notes

### 12-Hour Edit Restriction
- Transactions can only be edited within **12 hours** of creation
- The edit button is always visible
- Backend validates the time restriction
- After 12 hours, an error message is displayed

### Backend Connection
- Ensure your Spring Boot backend is running on port 5000
- The backend must have CORS enabled for `http://localhost:3000`
- Check `src/services/api.js` for API configuration

## 🐛 Troubleshooting

### "Failed to fetch dashboard data"
**Solution**: 
- Ensure backend is running on `http://localhost:5000`
- Check MongoDB connection in backend
- Verify CORS configuration allows `http://localhost:3000`

### "Cannot edit transaction after 12 hours"
**Solution**: 
- This is expected behavior (requirement from problem statement)
- Transaction was created more than 12 hours ago
- Create a new transaction or delete and recreate

### Blank screen or errors
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 Color Scheme

- **Primary Blue**: `#3B82F6` - Main actions, buttons
- **Success Green**: `#22C55E` - Income, positive values
- **Danger Red**: `#EF4444` - Expenses, delete actions
- **Purple**: `#A855F7` - Office division
- **Gray**: Neutral elements, backgrounds

## 📄 Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (⚠️ one-way operation)

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variable: `REACT_APP_API_URL=https://your-backend-url/api`
4. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Drag and drop `build` folder to Netlify
3. Set environment variable in Netlify dashboard
4. Redeploy

### Deploy to GitHub Pages

```bash
npm install --save-dev gh-pages

# Add to package.json:
"homepage": "https://YOUR-USERNAME.github.io/money-manager-frontend",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# Deploy
npm run deploy
```

## 🤝 Contributing

This is a hackathon submission project. Feel free to fork and improve!

## 📝 License

Open source - feel free to use for learning purposes.

## 👨‍💻 Author

Created for GUVI Hackathon

---

**Happy Budgeting! 💰**
